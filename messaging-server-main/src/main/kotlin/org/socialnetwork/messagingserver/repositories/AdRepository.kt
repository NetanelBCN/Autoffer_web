package org.socialnetwork.messagingserver.repositories

import org.socialnetwork.messagingserver.models.AdModel
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface AdRepository : ReactiveMongoRepository<AdModel, String> {
     fun findAdsByAudience(audience: String): Flux<AdModel>
}
