package org.socialnetwork.messagingserver.controllers

import org.socialnetwork.messagingserver.models.*
import org.socialnetwork.messagingserver.modelsdata.UnreadCountResponse
import org.socialnetwork.messagingserver.repositories.ChatRepository
import org.socialnetwork.messagingserver.repositories.MessageRepository
import org.socialnetwork.messagingserver.services.ChatService
import org.springframework.http.ResponseEntity
import org.springframework.messaging.handler.annotation.MessageExceptionHandler
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Controller
class ChatController(
    private val chatService: ChatService,
    private val messageRepository: MessageRepository,
    private val chatRepository: ChatRepository
) {

    @MessageMapping("chats.getOrCreate")
    fun getOrCreateChat(@Payload request: ChatRequest): Mono<ChatModel> {
        println("📥 ChatRequest received: $request")
        return chatService.getOrCreateChat(request.currentUserId, request.otherUserId)
    }

    @MessageMapping("chats.getAll")
    fun getUserChats(@Payload request: UserChatsRequest): Flux<ChatModel> {
        println("📥 getUserChats: userId=${request.userId}, page=${request.page}, size=${request.size}")
        return chatService.getUserChats(request.userId)
    }


    @MessageMapping("chats.getMessages")
    fun getChatMessages(@Payload request: ChatMessagesRequest): Flux<MessageModel> {
        println("📥 getChatMessages: $request")
        return chatService.getChatMessages(request.chatId, request.page, request.size)
    }

    @MessageMapping("chats.streamMessages")
    fun streamMessages(@Payload chatId: String): Flux<MessageModel> {
        println("📥 streamMessages: chatId = $chatId")
        return chatService.streamMessages(chatId)
    }

    @MessageMapping("chats.getChatById")
    fun getChatById(@Payload request: Map<String, String>): Mono<ChatModel> {
        val chatId = request["chatId"]
            ?: return Mono.error(IllegalArgumentException("Chat ID is required"))
        println("📥 getChatById: chatId = $chatId")
        return chatService.getChatById(chatId)
    }

    @MessageExceptionHandler
    fun handleException(ex: Exception): Mono<String> {
        println("🚨 Error in ChatController: ${ex.message}")
        ex.printStackTrace()
        return Mono.error(ex)
    }

    @MessageMapping("chats.getUnreadCount")
    fun getUnreadCount(@Payload request: UnreadCountRequest): Mono<UnreadCountResponse> {
        return messageRepository.countByChatIdAndSenderIdNotAndReadByNotContaining(
            request.chatId,
            request.userId,  // senderId ≠ userId
            request.userId   // readBy לא כולל userId
        ).map { count ->
            val safeCount = count?.toInt() ?: 0
            UnreadCountResponse(request.chatId, safeCount)
        }
    }

    @MessageMapping("chat.sendfile")
    fun handleFileMessage(request: FileMessageRequest): Mono<Void> {
        return chatService.sendFileMessage(request)
    }

    @GetMapping("/hasChats/{userId}")
    fun hasChats(@PathVariable userId: String): Mono<ResponseEntity<Boolean>> {
        return chatRepository.findByParticipantsContaining(userId)
            .hasElements()
            .map { hasChats -> ResponseEntity.ok(hasChats) }
    }
}
