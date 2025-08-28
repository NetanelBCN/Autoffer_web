package org.socialnetwork.messagingserver.models


data class ItemModel(
    val itemNumber: Int,
    val profile: AlumProfileModelDTO,
    val glass: GlassModelDTO,
    val height: Double,
    val width: Double,
    val quantity: Int,
    val location: String
)

fun AlumProfileModel.toDTO(): AlumProfileModelDTO = AlumProfileModelDTO(
    profileNumber = this.profileNumber,
    usageType = this.usageType,
    pricePerSquareMeter = this.pricePerSquareMeter
)

fun GlassModel.toDTO(): GlassModelDTO = GlassModelDTO(
    type = this.type,
    pricePerSquareMeter = this.pricePerSquareMeter
)
