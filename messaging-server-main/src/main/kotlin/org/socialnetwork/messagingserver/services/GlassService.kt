package org.socialnetwork.messagingserver.services

import org.socialnetwork.messagingserver.models.GlassModel
import org.socialnetwork.messagingserver.repositories.GlassRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux

@Service
class GlassService(
    private val glassRepository: GlassRepository
) {
    fun getGlassesForProfile(profileNumber: String): Flux<GlassModel> {
        return glassRepository.findBySupportedProfilesContaining(profileNumber)
    }
}

