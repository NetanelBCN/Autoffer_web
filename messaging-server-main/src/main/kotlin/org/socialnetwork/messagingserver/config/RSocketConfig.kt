package org.socialnetwork.messagingserver.config

import io.rsocket.transport.netty.server.WebsocketServerTransport
import org.springframework.boot.rsocket.server.RSocketServerCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.codec.json.Jackson2JsonDecoder
import org.springframework.http.codec.json.Jackson2JsonEncoder
import org.springframework.messaging.rsocket.RSocketStrategies
import org.springframework.messaging.rsocket.annotation.support.RSocketMessageHandler

@Configuration
class RSocketConfig {

    // ✅ אסטרטגיות סריאליזציה
    @Bean
    fun rSocketStrategies(): RSocketStrategies {
        return RSocketStrategies.builder()
            .encoders { it.add(Jackson2JsonEncoder()) }
            .decoders { it.add(Jackson2JsonDecoder()) }
            .build()
    }

    // ✅ ה-MessageHandler שמחבר את כל ה-@MessageMapping controllers
    @Bean
    fun rSocketMessageHandler(strategies: RSocketStrategies): RSocketMessageHandler {
        val handler = RSocketMessageHandler()
        handler.rSocketStrategies = strategies
        return handler
    }

    // ✅ מחבר את ה-message handler לשרת ה-RSocket
    @Bean
    fun rSocketServerCustomizer(handler: RSocketMessageHandler): RSocketServerCustomizer {
        return RSocketServerCustomizer { server ->
            server.acceptor(handler.responder()) // זה מה שחיבר לך את כל הפינגים והצ׳אט וכו'
        }
    }
}
