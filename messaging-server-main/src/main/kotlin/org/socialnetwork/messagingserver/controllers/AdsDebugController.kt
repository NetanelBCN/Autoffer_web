package org.socialnetwork.messagingserver.controllers

import org.socialnetwork.messagingserver.models.AdModel
import org.socialnetwork.messagingserver.services.AdsService
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux

@RestController
class AdsDebugController(
    private val adsService: AdsService
) {

    @GetMapping("/debug/ads",
        produces = [MediaType.APPLICATION_JSON_VALUE])
    fun debugAllAds(): Flux<AdModel> {
        return adsService.getAllAds()
            .doOnSubscribe { println("🚀 Subscribed to getAllAds") }
            .doOnNext { println("📦 In DB (GET): title=${it.title}, audience=${it.audience}") }
            .doOnComplete { println("🏁 Done fetching all ads") }
            .doOnError { println("❌ Error: ${it.message}") }
    }
}
