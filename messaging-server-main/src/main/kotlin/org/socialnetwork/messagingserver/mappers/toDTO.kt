package org.socialnetwork.messagingserver.mappers

import org.socialnetwork.messagingserver.models.*

// Map full entities (with images) to minimal DTOs for embedding
fun AlumProfileModel.toDTO(): AlumProfileModelDTO = AlumProfileModelDTO(
    profileNumber = this.profileNumber,
    usageType = this.usageType,
    pricePerSquareMeter = this.pricePerSquareMeter
)

fun GlassModel.toDTO(): GlassModelDTO = GlassModelDTO(
    type = this.type,
    pricePerSquareMeter = this.pricePerSquareMeter
)

// No additional mappers needed for ItemModelDTO or ProjectModel because ProjectModel embeds ItemModelDTO directly

