package org.socialnetwork.messagingserver.repositories

import org.socialnetwork.messagingserver.models.UserModel
import org.socialnetwork.messagingserver.models.UserType
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono


interface UserRepository : ReactiveMongoRepository<UserModel, String>{
    fun findByEmail(email: String): Mono<UserModel>
    fun findByPhoneNumber(phoneNumber: String): Mono<UserModel>
    fun findAllByProfileType(profileType: UserType): Flux<UserModel>

}

