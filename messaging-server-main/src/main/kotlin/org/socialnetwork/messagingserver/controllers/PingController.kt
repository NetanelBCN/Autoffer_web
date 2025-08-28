package com.example.messagingserver.controllers

import io.rsocket.Payload
import io.rsocket.util.DefaultPayload
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.stereotype.Controller
import reactor.core.publisher.Mono

@Controller
class PingController {

    @MessageMapping("ping")
    fun handlePing(payload: Payload): Mono<Payload> {
        val message = payload.dataUtf8
        println("✅ Got ping: $message")
        return Mono.just(DefaultPayload.create("✅ Pong from server"))
    }

}
