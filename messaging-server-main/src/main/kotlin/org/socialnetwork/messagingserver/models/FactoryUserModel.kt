import org.socialnetwork.messagingserver.models.UserModel
import org.socialnetwork.messagingserver.models.UserType
import org.springframework.data.annotation.TypeAlias
import java.time.LocalDateTime

@TypeAlias("factoryUser")
class FactoryUserModel(
    val businessId: String = "",
    val factor: Double = 1.0,
    val factoryName: String = "",
    id: String? = null,
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    phoneNumber: String,
    address: String,
    profileType: UserType = UserType.FACTORY,
    registeredAt: LocalDateTime = LocalDateTime.now(),
    chats: MutableList<String> = mutableListOf(),
    photoBytes: ByteArray? = null
) : UserModel(
    id = id,
    firstName = firstName,
    lastName = lastName,
    email = email,
    password = password,
    phoneNumber = phoneNumber,
    address = address,
    profileType = profileType,
    registeredAt = registeredAt,
    chats = chats,
    photoBytes = photoBytes
)
