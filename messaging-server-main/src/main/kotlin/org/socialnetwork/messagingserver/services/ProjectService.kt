package org.socialnetwork.messagingserver.services


import FactoryUserModel
import org.socialnetwork.messagingserver.models.*
import org.socialnetwork.messagingserver.repositories.AlumProfileRepository
import org.socialnetwork.messagingserver.repositories.GlassRepository
import org.socialnetwork.messagingserver.repositories.ProjectRepository
import org.socialnetwork.messagingserver.repositories.UserRepository
import org.socialnetwork.messagingserver.utils.ImageLoader
import org.socialnetwork.messagingserver.utils.PdfGenerator
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.util.function.Tuple2
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.*

@Service
class ProjectService(
    private val alumProfileRepository: AlumProfileRepository,
    private val glassRepository: GlassRepository,
    private val projectRepository: ProjectRepository,
    private val chatService: ChatService,
    private val pdfGenerator: PdfGenerator,
    private val userRepository: UserRepository,
    private val userService: UserService
) {
    private val formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")
        .withZone(ZoneId.of("UTC"))

    fun getProjectById(projectId: String): Mono<ProjectDTO> =
        projectRepository.findById(projectId)
            .map { model ->
                ProjectDTO(
                    projectId = model.id ?: "",
                    clientId = model.clientId,
                    projectAddress = model.projectAddress,
                    items = model.items,
                    factoryIds = model.factoryIds,
                    quoteStatuses = model.quoteStatuses.mapValues { it.value }, // אם בצד DTO זו מפת String
                    quotes = model.quotes, // ✅ הוספת השדה החסר
                    boqPdf = model.boqPdf,
                    createdAt = formatter.format(model.createdAt)
                )
            }

    fun createProjectFromDto(dto: CreateProjectRequest): Mono<ProjectDTO> =
        Flux.fromIterable(dto.items)
            .flatMap { itemDto ->
                Mono.zip(
                    alumProfileRepository.findByProfileNumber(itemDto.profile.profileNumber).next(),
                    glassRepository.findByType(itemDto.glass.type)
                ).map { tuple ->
                    ItemModelDTO(
                        itemNumber = itemDto.itemNumber,
                        profile = tuple.t1.toDTO(),
                        glass = tuple.t2.toDTO(),
                        height = itemDto.height,
                        width = itemDto.width,
                        quantity = itemDto.quantity,
                        location = itemDto.location
                    )
                }
            }
            .collectList()
            .flatMap { itemDtos ->
                val initialProject = ProjectModel(
                    clientId = dto.clientId,
                    projectAddress = dto.projectAddress,
                    items = itemDtos,
                    factoryIds = dto.factoryIds
                )
                projectRepository.save(initialProject)
            }
            .flatMap { savedProject ->
                userRepository.findById(savedProject.clientId)
                    .map { client -> savedProject to client }
            }
            .flatMap { (project, client) ->
                // ✅ טעינת לוגו אוטופר כ-ByteArray
                val autofferLogoBytes = ImageLoader.loadImageAsBytes("/images/AutofferLogo.jpg")

                val boqBytes = pdfGenerator.generateBoqPdf(
                    project = project,
                    client = client,
                    autofferLogoBytes = autofferLogoBytes!!
                )
                val updatedProject = project.copy(boqPdf = boqBytes.toList())
                projectRepository.save(updatedProject)
            }
            .map { model ->
                ProjectDTO(
                    projectId = model.id ?: "",
                    clientId = model.clientId,
                    projectAddress = model.projectAddress,
                    items = model.items,
                    factoryIds = model.factoryIds,
                    quoteStatuses = model.quoteStatuses,
                    boqPdf = model.boqPdf,
                    quotes = model.quotes,
                    createdAt = formatter.format(model.createdAt)
                )
            }

    fun sendBOQToFactories(request: SendBOQRequest): Mono<Void> =
    projectRepository.findById(request.projectId).flatMap { project ->
        val boqBytes = project.boqPdf?.toByteArray()
            ?: return@flatMap Mono.error(IllegalStateException("Missing BOQ PDF"))

        val timestamp = Instant.now()
            .atZone(ZoneId.of("UTC"))
            .format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"))

        userRepository.findAllById(request.factoryIds).collectList().flatMap { factoryUsers ->
            val updatedStatuses = project.quoteStatuses.toMutableMap().apply {
                factoryUsers.forEach { user ->
                    this[user.id!!] = QuoteStatus.PENDING
                }
            }

            val updatedFactoryIds = (project.factoryIds + request.factoryIds).distinct()

            val updatedProject = project.copy(
                quoteStatuses = updatedStatuses,
                factoryIds = updatedFactoryIds
            )

            val sendToFactories = factoryUsers.map { factory ->
                chatService.getOrCreateChat(project.clientId, factory.id!!)
                    .map { it.id!! }
                    .flatMap { chatId ->
                        val fileRequest = FileMessageRequest(
                            chatId = chatId,
                            sender = project.clientId,
                            receiver = factory.id!!,
                            fileBytes = boqBytes.toList(),
                            fileName = "BOQ_Project_${project.id}.pdf",
                            fileType = "application/pdf",
                            timestamp = timestamp
                        )
                        chatService.sendFileMessage(fileRequest)
                    }
            }

            // הודעת מערכת ללקוח – נשלחת פעם אחת (נבחר מפעל ראשון כ״system sender״)
            val notifyClient = chatService.getOrCreateChat(project.clientId, request.factoryIds.first())
                .map { it.id!! }
                .flatMap { chatId ->
                    val textRequest = TextMessageRequest(
                        chatId = chatId,
                        sender = request.factoryIds.first(), // מי שמייצג את המערכת
                        receiver = project.clientId,
                        content = """
                            Dear Customer,
                            We have received your project and will update you on its progress accordingly.
                            You can track the status at any time under the “My Projects” tab.
                        """.trimIndent(),
                        timestamp = timestamp
                    )
                    chatService.sendTextMessage(textRequest)
                }

            projectRepository.save(updatedProject)
                .thenMany(Flux.merge(sendToFactories))
                .then(notifyClient)
        }
    }

    fun hasProjects(clientId: String): Mono<Boolean> {
        return projectRepository.findByClientId(clientId)
            .hasElements()
    }

    fun respondToBOQRequest(request: UpdateFactoryStatusRequest, approved: Boolean): Mono<Void> {
        val status = if (approved) QuoteStatus.ACCEPTED else QuoteStatus.REJECTED
        val now = Instant.now()

        return projectRepository.findById(request.projectId).flatMap { project ->

            chatService.getOrCreateChat(request.factoryId, project.clientId).flatMap { chat ->
                val chatId = chat.id!!

                val message = if (approved) {
                    "Your project has been approved by the factory. A quote has been generated."
                } else {
                    "Your project was declined by the factory. We apologize and hope to work with you in the future."
                }

                val notifyClient = TextMessageRequest(
                    chatId = chatId,
                    sender = request.factoryId,
                    receiver = project.clientId,
                    content = message,
                    timestamp = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")
                        .withZone(ZoneId.of("UTC")).format(now)
                )

                val updatedStatuses = project.quoteStatuses.toMutableMap().apply {
                    this[request.factoryId] = status
                }

                if (approved) {
                    return@flatMap userService.getUserById(project.clientId)
                        .zipWith(userService.getFactoryById(request.factoryId))
                        .flatMap { tuple: Tuple2<UserModel, FactoryUserModel> ->
                            val client = tuple.t1
                            val factory = tuple.t2

                            val quoteBytes = pdfGenerator.generateQuotePdf(
                                project = project,
                                client = client,
                                factoryUser = factory,
                                factoryLogoBytes = factory.photoBytes ?: ByteArray(0)
                            )

                            val quote = QuoteModel(
                                id = UUID.randomUUID().toString(),
                                factoryId = request.factoryId,
                                projectId = project.id ?: "",
                                pricedItems = project.items,
                                factor = 1.0,
                                finalPrice = 0.0,
                                quotePdf = quoteBytes.toList(),
                                status = "RECEIVED",
                                createdAt = now
                            )

                            val updatedQuotes = project.quotes.toMutableMap().apply {
                                this[request.factoryId] = quote // מעדכן או מוסיף את ההצעה למפתח של המפעל
                            }

                            val updatedProject = project.copy(
                                quoteStatuses = updatedStatuses,
                                quotes = updatedQuotes
                            )

                            projectRepository.save(updatedProject)
                                .then(chatService.sendTextMessage(notifyClient))
                        }
                } else {
                    val updatedProject = project.copy(quoteStatuses = updatedStatuses)
                    projectRepository.save(updatedProject)
                        .then(chatService.sendTextMessage(notifyClient))
                }
            }
        }.then()
    }

    fun getProjectsByClientId(clientId: String): Flux<ProjectDTO> {
        val cleanedClientId = clientId.trim('"')
        return projectRepository.findAllByClientId(cleanedClientId)
            .map { model ->
                ProjectDTO(
                    projectId = model.id ?: "",
                    clientId = model.clientId,
                    projectAddress = model.projectAddress,
                    items = model.items,
                    factoryIds = model.factoryIds,
                    quoteStatuses = model.quoteStatuses,
                    boqPdf = model.boqPdf,
                    quotes = model.quotes,
                    createdAt = formatter.format(model.createdAt)
                )
            }
    }

    fun getApprovedProjectsByFactoryId(factoryId: String): Flux<ProjectDTO> {
        return projectRepository.findAll()
            .filter { project ->
                project.factoryIds.contains(factoryId) &&
                        project.quoteStatuses[factoryId] == QuoteStatus.ACCEPTED
            }
            .map { model ->
                ProjectDTO(
                    projectId = model.id ?: "",
                    clientId = model.clientId,
                    projectAddress = model.projectAddress,
                    items = model.items,
                    factoryIds = model.factoryIds,
                    quoteStatuses = model.quoteStatuses,
                    boqPdf = model.boqPdf,
                    quotes = model.quotes,
                    createdAt = formatter.format(model.createdAt)
                )
            }
    }

    fun generateAndSaveQuotePdf(
        projectId: String,
        client: UserModel,
        factoryUser: FactoryUserModel,
        factoryLogoBytes: ByteArray
    ): Mono<Void> {
        return projectRepository.findById(projectId).flatMap { project ->
            val quotePdf = pdfGenerator.generateQuotePdf(project, client, factoryUser, factoryLogoBytes)

            val quoteModel = QuoteModel(
                factoryId = factoryUser.id!!,
                projectId = projectId,
                pricedItems = project.items,
                factor = 1.0, // ניתן לשנות בהמשך לפי לוגיקה
                finalPrice = 0.0, // ניתן לעדכן בהתאם לפריטים
                quotePdf = quotePdf.toList(),
                status = "RECEIVED",
                createdAt = Instant.now()
            )

            val updatedQuotes = project.quotes.toMutableMap().apply {
                this[factoryUser.id!!] = quoteModel
            }

            val updatedProject = project.copy(quotes = updatedQuotes)

            projectRepository.save(updatedProject).then()
        }
    }

    fun updateFactoryStatus(request: UpdateFactoryStatusRequest): Mono<Void> {
        return projectRepository.findById(request.projectId).flatMap { project ->
            val updatedStatuses = project.quoteStatuses.toMutableMap().apply {
                this[request.factoryId] = request.newStatus
            }

            val updatedProject = project.copy(quoteStatuses = updatedStatuses)
            projectRepository.save(updatedProject).then()
        }
    }

    fun getQuotePdfForFactory(projectId: String, factoryId: String): Mono<ByteArray> {
        return projectRepository.findById(projectId)
            .flatMap { project ->
                val quoteModel = project.quotes[factoryId]
                    ?: return@flatMap Mono.error<ByteArray>(IllegalStateException("No quote found for factoryId=$factoryId"))

                val pdfBytes = quoteModel.quotePdf
                    ?: return@flatMap Mono.error<ByteArray>(IllegalStateException("No quote PDF found for factoryId=$factoryId"))

                Mono.just(pdfBytes.toByteArray())
            }
    }

    fun getBoqPdf(projectId: String): Mono<ByteArray> {
        return projectRepository.findById(projectId)
            .flatMap { project ->
                val pdfBytes = project.boqPdf
                    ?: return@flatMap Mono.error<ByteArray>(IllegalStateException("No BOQ PDF found for projectId=$projectId"))
                Mono.just(pdfBytes.toByteArray())
            }
    }

    fun deleteProjectById(projectId: String): Mono<Void> =
        projectRepository.deleteById(projectId)

}
