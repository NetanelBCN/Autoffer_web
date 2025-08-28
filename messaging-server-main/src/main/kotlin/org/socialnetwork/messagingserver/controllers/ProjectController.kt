package org.socialnetwork.messagingserver.controllers

import org.socialnetwork.messagingserver.models.*
import org.socialnetwork.messagingserver.services.ProjectService
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.stereotype.Controller
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Controller
class ProjectController(
    private val projectService: ProjectService
) {
    @MessageMapping("project.create")
    fun createProject(@Payload request: CreateProjectRequest): Mono<ProjectDTO> =
        projectService.createProjectFromDto(request)

    @MessageMapping("projects.getById")
    fun getProjectById(@Payload projectId: String): Mono<ProjectDTO> =
        projectService.getProjectById(projectId)


    @MessageMapping("projects.sendToFactories")
    fun sendToFactories(@Payload request: SendBOQRequest): Mono<Void> =
        projectService.sendBOQToFactories(request)


    @MessageMapping("projects.getAllForUser")
    fun getProjectsForUser(@Payload request: UserProjectRequest): Flux<ProjectDTO> {
        return when (request.profileType) {
            UserType.FACTORY -> {
                println("🔍 Loading projects for FACTORY=${request.userId}")
                projectService.getApprovedProjectsByFactoryId(request.userId)
            }
            else -> {
                println("🔍 Loading projects for CLIENT=${request.userId}")
                projectService.getProjectsByClientId(request.userId)
            }
        }
    }



    @MessageMapping("projects.delete")
    fun deleteProject(@Payload projectId: String): Mono<Void> =
        projectService.deleteProjectById(projectId)

    // ✅ חדש: יצירת ושמירת הצעת מחיר עבור מפעל
    @MessageMapping("projects.generateQuotePdf")
    fun generateQuotePdf(@Payload request: GenerateQuotePdfRequest): Mono<Void> =
        projectService.generateAndSaveQuotePdf(
            request.projectId,
            request.client,
            request.factoryUser,
            request.factoryLogoBytes
        )

    @MessageMapping("projects.updateFactoryStatus")
    fun updateFactoryStatus(@Payload request: UpdateFactoryStatusRequest): Mono<Void> =
        projectService.updateFactoryStatus(request)


    @MessageMapping("projects.respondToBoqRequest")
    fun respondToBoqRequest(@Payload request: UpdateFactoryStatusRequest): Mono<Void> {
        val isApproved = request.newStatus == QuoteStatus.ACCEPTED
        return projectService.respondToBOQRequest(request, approved = isApproved)
    }

    // ✅ חדש: שליפת קובץ BOQ PDF
    @MessageMapping("projects.getBoqPdf")
    fun getBoqPdf(@Payload projectId: String): Mono<ByteArray> =
        projectService.getBoqPdf(projectId)

    // ✅ חדש: שליפת קובץ הצעת מחיר לפי מזהה מפעל
    @MessageMapping("projects.getQuotePdfForFactory")
    fun getQuotePdf(@Payload request: GetQuotePdfRequest): Mono<ByteArray> =
        projectService.getQuotePdfForFactory(request.projectId, request.factoryId)

    @MessageMapping("projects.hasAny")
    fun hasAnyProjects(@Payload clientId: String): Mono<Boolean> {
        return projectService.hasProjects(clientId)
    }

}
