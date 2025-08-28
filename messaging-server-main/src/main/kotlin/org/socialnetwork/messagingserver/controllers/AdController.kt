package org.socialnetwork.messagingserver.controllers

import org.socialnetwork.messagingserver.models.AdsRequest
import org.socialnetwork.messagingserver.models.AdModel
import org.socialnetwork.messagingserver.repositories.AdRepository
import org.socialnetwork.messagingserver.services.AdsService
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import reactor.core.publisher.Flux

@Controller
class AdsController(
    private val adsService: AdsService
) {

    @MessageMapping("ads.getAdsForAudience")
    fun getAdsForAudience(request: AdsRequest): Flux<AdModel> {
        println("📢 Fetching ads for audience: ${request.audience.name}")

        // DEBUG זמני - מדפיס את כל הערכים במסד הנתונים
//        adsService.getAllAds()
//            .doOnSubscribe { println("🚀 Subscribed to getAllAds") }
//            .doOnComplete { println("🏁 Done fetching all ads") }
//            .doOnError { println("❌ Error: ${it.message}") }
//            .subscribe()


        return adsService.getAdsForAudience(request.audience.name)
            .doOnNext { println("✅ Found ad: ${it.title}") }
    }



}
