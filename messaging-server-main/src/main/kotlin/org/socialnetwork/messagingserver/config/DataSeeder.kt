package org.socialnetwork.messagingserver.config

import jakarta.annotation.PostConstruct
import org.socialnetwork.messagingserver.models.AlumProfileModel
import org.socialnetwork.messagingserver.models.AlumProfileUsageType
import org.socialnetwork.messagingserver.models.GlassModel
import org.socialnetwork.messagingserver.repositories.AlumProfileRepository
import org.socialnetwork.messagingserver.repositories.GlassRepository
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono
import java.io.IOException

@Component
class DataSeeder(
    private val alumProfileRepository: AlumProfileRepository,
    private val glassRepository: GlassRepository
) {

    @PostConstruct
    fun seedData() {
        alumProfileRepository.count()
            .zipWith(glassRepository.count())
            .flatMap { t ->
                val profileCount = t.t1
                val glassCount = t.t2

                if (profileCount == 0L && glassCount == 0L) {
                    insertProfiles().then(insertGlasses())
                } else {
                    Mono.empty()
                }
            }
            .subscribe()
    }

    private fun insertProfiles(): Mono<Void> {
        val profiles = listOf(
            createProfile("1700", AlumProfileUsageType.WINDOW_SLIDE, 600, 1500, 600, 1800, true, "Triplex 3+3", 320.0, "1700_slide_window-2.jpg"),
            createProfile("2200", AlumProfileUsageType.DOOR_SLIDE, 1800, 2600, 1800, 4000, true, "Triplex 4+4", 747.0, "2200_slide_door-2.jpg"),
            createProfile("4300", AlumProfileUsageType.DOOR_OPEN, 1800, 2300, 800, 1000, false, "Triplex 5+5", 301.0, "4300_open_door-2.jpg"),
            createProfile("4500", AlumProfileUsageType.WINDOW_OPEN, 600, 1500, 600, 1800, false, "Triplex 5+5", 293.0, "4500_open_window-2.jpg"),
            createProfile("5500", AlumProfileUsageType.DOOR_OPEN, 1800, 2300, 800, 1000, true, "Triplex 6+6", 320.0, "5500_open_door-2.jpg"),
            createProfile("5500", AlumProfileUsageType.WINDOW_OPEN, 600, 1500, 600, 1800, true, "Triplex 6+6", 320.0, "5500_open_window-2.jpg"),
            createProfile("7000", AlumProfileUsageType.WINDOW_SLIDE, 600, 1500, 600, 1800, false, "Triplex 4+4", 213.0, "7000_slide_window-2.jpg"),
            createProfile("9000", AlumProfileUsageType.DOOR_SLIDE, 1800, 2600, 1800, 4000, false, "Insulated 12+18+12", 293.0, "9000_slide_door-2.jpg")
        )
        return alumProfileRepository.saveAll(profiles).then()
    }

    private fun insertGlasses(): Mono<Void> {
        val imageData = loadImageAsByteList("images/glass_general.jpg") // ✅ נטען פעם אחת בלבד

        val glasses = listOf(
            GlassModel(null, "Triplex 3+3", listOf("1700"), 187.0, imageData),
            GlassModel(null, "Triplex 4+4", listOf("2200", "7000"), 240.0, imageData),
            GlassModel(null, "Triplex 5+5", listOf("4300", "4500"), 227.0, imageData),
            GlassModel(null, "Triplex 6+6", listOf("5500"), 307.0, imageData),
            GlassModel(null, "Insulated 12+18+12", listOf("9000"), 280.0, imageData)
        )
        return glassRepository.saveAll(glasses).then()
    }

    private fun createProfile(
        profileNumber: String,
        usageType: AlumProfileUsageType,
        minHeight: Int,
        maxHeight: Int,
        minWidth: Int,
        maxWidth: Int,
        isExpensive: Boolean,
        recommendedGlass: String,
        pricePerSquareMeter: Double,
        imageName: String
    ): AlumProfileModel {
        val imageData = loadImageAsByteList("images/$imageName")
        return AlumProfileModel(
            profileNumber = profileNumber,
            usageType = usageType,
            minHeight = minHeight,
            maxHeight = maxHeight,
            minWidth = minWidth,
            maxWidth = maxWidth,
            isExpensive = isExpensive,
            recommendedGlassType = recommendedGlass,
            pricePerSquareMeter = pricePerSquareMeter,
            imageData = imageData
        )
    }

    private fun loadImageAsByteList(path: String): List<Byte>? {
        return try {
            val resource = ClassPathResource(path)
            resource.inputStream.use { it.readBytes().toList() }
        } catch (e: IOException) {
            println("⚠️ Failed to load image: $path – ${e.message}")
            null
        }
    }
}