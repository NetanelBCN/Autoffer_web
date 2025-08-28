package org.socialnetwork.messagingserver.utils

import java.io.IOException

object ImageLoader {

    /**
     * Loads an image from the resources folder and returns it as a nullable ByteArray.
     *
     * @param path path to image relative to `/resources`, for example: `/images/AutofferLogo.jpg`
     * @return ByteArray? or null if not found or failed to read
     */
    fun loadImageAsBytes(path: String): ByteArray? {
        val inputStream = ImageLoader::class.java.getResourceAsStream(path)
            ?: return null

        return try {
            inputStream.readBytes()
        } catch (e: IOException) {
            null
        }
    }
}
