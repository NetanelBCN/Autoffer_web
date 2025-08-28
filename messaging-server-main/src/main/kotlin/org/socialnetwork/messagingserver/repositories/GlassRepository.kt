package org.socialnetwork.messagingserver.repositories

import org.socialnetwork.messagingserver.models.GlassModel
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface GlassRepository : ReactiveMongoRepository<GlassModel, String> {
    fun findBySupportedProfilesContaining(profileNumber: String): Flux<GlassModel>
    fun findByType(type: String): Mono<GlassModel>
}
