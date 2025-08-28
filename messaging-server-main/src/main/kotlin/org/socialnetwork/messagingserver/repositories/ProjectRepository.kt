package org.socialnetwork.messagingserver.repositories

import org.bson.types.ObjectId
import org.socialnetwork.messagingserver.models.ProjectModel
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux


interface ProjectRepository : ReactiveMongoRepository<ProjectModel, String> {
    fun findAllByClientId(clientId: String): Flux<ProjectModel>
    fun findByClientId(clientId: String): Flux<ProjectModel>
}
