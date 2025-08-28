package org.socialnetwork.messagingserver.repositories

import org.socialnetwork.messagingserver.models.ChatModel
import org.springframework.data.domain.Pageable
import org.springframework.data.mongodb.repository.Query
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Repository
interface ChatRepository : ReactiveMongoRepository<ChatModel, String> {
    fun findByParticipantsContaining(participants: List<String>): Mono<ChatModel>
    fun findAllByParticipantsContaining(userId: String): Flux<ChatModel>
    fun findByParticipants(participants: List<String>): Mono<ChatModel>

    @Query("{ 'participants': { \$all: ?0 }, 'participants.2': { \$exists: false } }")
    fun findChatByExactParticipants(participants: List<String>): Mono<ChatModel>

    fun findByParticipantsContaining(userId: String): Flux<ChatModel>

}

