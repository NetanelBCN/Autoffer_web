package org.socialnetwork.messagingserver.controllers

import org.socialnetwork.messagingserver.models.AlumProfileModel
import org.socialnetwork.messagingserver.models.GlassModel
import org.socialnetwork.messagingserver.models.SizeRequest
import org.socialnetwork.messagingserver.services.AlumProfileService
import org.socialnetwork.messagingserver.services.GlassService
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.stereotype.Controller
import reactor.core.publisher.Flux

@Controller
class ProfileGlassController(
    private val alumProfileService: AlumProfileService,
    private val glassService: GlassService
) {

    @MessageMapping("profiles.matchBySize")
    fun matchProfilesBySize(size: SizeRequest): Flux<AlumProfileModel> {
        println("📩 Received request to match profiles with width=${size.width}, height=${size.height}")
        return alumProfileService.getMatchingProfiles(size.width, size.height)
            .doOnNext { println("✅ Matching profile found: ${it.profileNumber}") }
            .doOnComplete { println("✅ Done matching profiles") }
    }

    @MessageMapping("glasses.getByProfile")
    fun getGlassesByProfile(profileNumber: String): Flux<GlassModel> {
        println("📩 Received request for glasses of profile: \"$profileNumber\"")

        val cleanProfileNumber = profileNumber.trim().replace("\"", "")
        println("🔍 Looking for glasses matching profileNumber='$cleanProfileNumber'")

        return glassService.getGlassesForProfile(cleanProfileNumber)
            .doOnNext {
                println("👓 Found glass in DB: ${it.type}, supports: ${it.supportedProfiles}")
            }
            .doOnComplete {
                println("✅ Done retrieving glasses")
            }
    }

}
