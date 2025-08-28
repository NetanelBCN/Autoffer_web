package org.socialnetwork.messagingserver.repositories

import org.socialnetwork.messagingserver.models.AlumProfileModel
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface AlumProfileRepository : ReactiveMongoRepository<AlumProfileModel, String> {

    fun findAllByMinHeightLessThanEqualAndMaxHeightGreaterThanEqualAndMinWidthLessThanEqualAndMaxWidthGreaterThanEqual(
        minHeight: Int,
        maxHeight: Int,
        minWidth: Int,
        maxWidth: Int
    ): Flux<AlumProfileModel>

    fun findByProfileNumber(profileNumber: String): Flux<AlumProfileModel>
}
