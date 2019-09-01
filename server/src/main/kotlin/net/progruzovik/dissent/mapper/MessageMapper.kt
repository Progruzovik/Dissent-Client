package net.progruzovik.dissent.mapper

import net.progruzovik.dissent.model.event.Event
import net.progruzovik.dissent.model.message.ServerMessage
import net.progruzovik.dissent.model.message.ServerSubject
import org.springframework.stereotype.Component
import java.util.function.Function

@Component
class MessageMapper : Function<Event<*>, ServerMessage<*>> {

    override fun apply(event: Event<*>) = ServerMessage(ServerSubject.valueOf(event.subject.name), event.data)
}