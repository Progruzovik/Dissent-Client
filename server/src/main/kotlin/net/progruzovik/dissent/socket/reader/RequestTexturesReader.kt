package net.progruzovik.dissent.socket.reader

import net.progruzovik.dissent.captain.Player
import net.progruzovik.dissent.model.message.ClientSubject
import net.progruzovik.dissent.model.message.ServerMessage
import net.progruzovik.dissent.model.message.ServerSubject
import net.progruzovik.dissent.repository.TextureRepository
import org.springframework.stereotype.Component

@Component
class RequestTexturesReader(private val textureRepository: TextureRepository) : Reader {

    override val subject = ClientSubject.REQUEST_TEXTURES

    override fun read(player: Player, data: Map<String, Int>) {
        player.sendMessage(ServerMessage(ServerSubject.TEXTURES, textureRepository.findAll()))
    }
}
