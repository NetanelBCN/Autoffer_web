package org.socialnetwork.messagingserver.services

import org.socialnetwork.messagingserver.models.MessageModel
import org.socialnetwork.messagingserver.repositories.MessageRepository
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime

@Service
class MessagingService(private val messageRepository: MessageRepository,
                       private val chatService: ChatService) {

    fun sendMessage(message: MessageModel): Mono<MessageModel> {
        val messageToSave = message.copy(timestamp = LocalDateTime.now().toString())

        return messageRepository.save(messageToSave)
            .flatMap { savedMessage ->
                chatService.updateChatLastMessage(savedMessage.chatId, savedMessage.content, savedMessage.timestamp!!)
                    .thenReturn(savedMessage)
            }
            .doOnNext {
                chatService.emitMessage(it.chatId, it)
            }
    }
    fun markMessagesAsRead(chatId: String, userId: String): Mono<Void> {
        return messageRepository.findAllByChatIdOrderByTimestampAsc(chatId, PageRequest.of(0, Int.MAX_VALUE))
            .filter { it.readBy?.contains(userId) != true }
            .flatMap { message ->
                val updated = message.copy(readBy = (message.readBy ?: mutableListOf()).apply { add(userId) })
                messageRepository.save(updated)
            }
            .then()
    }


}
