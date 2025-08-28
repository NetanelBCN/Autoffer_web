package org.socialnetwork.messagingserver.models

data class ItemModelDTO(
    val itemNumber: Int,
    val profile: AlumProfileModelDTO,
    val glass: GlassModelDTO,
    val height: Double,
    val width: Double,
    val quantity: Int,
    val location: String
)
