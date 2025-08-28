package org.socialnetwork.messagingserver.config

import FactoryUserModel
import jakarta.annotation.PostConstruct
import org.socialnetwork.messagingserver.models.UserType
import org.socialnetwork.messagingserver.repositories.UserRepository
import org.socialnetwork.messagingserver.utils.ImageLoader
import org.springframework.stereotype.Component
import reactor.kotlin.core.publisher.switchIfEmpty
import java.time.LocalDateTime

@Component
class FactoryUserSeeder(private val userRepository: UserRepository) {

    @PostConstruct
    fun seed() {
        createIfNotExists(
            businessId = "factory001",
            factoryName = "Alumax Industries",
            factor = 1.15,
            firstName = "David",
            lastName = "Goldman",
            email = "david@alumax.com",
            password = "pass1234",
            phoneNumber = "0501234567",
            address = "Industrial Park 1, Haifa",
            logoPath = "/images/FactoryLogo1.jpg"
        )

        createIfNotExists(
            businessId = "factory002",
            factoryName = "GlassPro Ltd.",
            factor = 1.10,
            firstName = "Rina",
            lastName = "Levi",
            email = "rina@glasspro.com",
            password = "pass1234",
            phoneNumber = "0527654321",
            address = "Kiryat Matalon, Petah Tikva",
            logoPath = "/images/FactoryLogo2.jpg"
        )

        createIfNotExists(
            businessId = "factory003",
            factoryName = "Elite Aluminum",
            factor = 1.20,
            firstName = "Yossi",
            lastName = "Ben-David",
            email = "yossi@elitealum.com",
            password = "pass1234",
            phoneNumber = "0539876543",
            address = "Atidim Park, Tel Aviv",
            logoPath = "/images/FactoryLogo3.jpg"
        )
    }

    private fun createIfNotExists(
        businessId: String,
        factoryName: String,
        factor: Double,
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        phoneNumber: String,
        address: String,
        logoPath: String
    ) {
        val logoBytes: ByteArray? = try {
            ImageLoader.loadImageAsBytes(logoPath)
        } catch (e: Exception) {
            null
        }

        userRepository.findByEmail(email)
            .switchIfEmpty {
                val user = FactoryUserModel(
                    businessId = businessId,
                    factoryName = factoryName,
                    factor = factor,
                    firstName = firstName,
                    lastName = lastName,
                    email = email,
                    password = password,
                    phoneNumber = phoneNumber,
                    address = address,
                    profileType = UserType.FACTORY,
                    registeredAt = LocalDateTime.now(),
                    chats = mutableListOf(),
                    photoBytes = logoBytes
                )
                return@switchIfEmpty userRepository.save(user)
            }
            .subscribe()
    }
}
