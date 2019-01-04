package net.progruzovik.dissent.socket;

import com.fasterxml.jackson.databind.ObjectMapper;
import net.progruzovik.dissent.battle.model.field.gun.GunCells;
import net.progruzovik.dissent.battle.model.util.Cell;
import net.progruzovik.dissent.captain.Player;
import net.progruzovik.dissent.dao.MissionDao;
import net.progruzovik.dissent.dao.TextureDao;
import net.progruzovik.dissent.model.message.ClientMessage;
import net.progruzovik.dissent.model.message.ClientSubject;
import net.progruzovik.dissent.model.message.ServerMessage;
import net.progruzovik.dissent.model.message.ServerSubject;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public final class DissentWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper;
    private final Map<ClientSubject, Reader> readers = new HashMap<>();

    public DissentWebSocketHandler(ObjectMapper mapper, TextureDao textureDao, MissionDao missionDao) {
        this.mapper = mapper;
        readers.put(ClientSubject.REQUEST_TEXTURES, (p, d) ->
                p.sendMessage(new ServerMessage<>(ServerSubject.TEXTURES, textureDao.getTextures())));

        readers.put(ClientSubject.REQUEST_STATUS, (p, d) ->
                p.sendMessage(new ServerMessage<>(ServerSubject.STATUS, p.getStatus())));
        readers.put(ClientSubject.REQUEST_SHIPS, (p, d) ->
                p.sendMessage(new ServerMessage<>(ServerSubject.SHIPS, p.getShips())));
        readers.put(ClientSubject.REQUEST_MISSIONS, (p, d) ->
                p.sendMessage(new ServerMessage<>(ServerSubject.MISSIONS, missionDao.getMissions())));
        readers.put(ClientSubject.ADD_TO_QUEUE, (p, d) -> p.addToQueue());
        readers.put(ClientSubject.REMOVE_FROM_QUEUE, (p, d) -> p.removeFromQueue());
        readers.put(ClientSubject.START_MISSION, (p, d) -> p.startMission(d.get("missionId")));

        readers.put(ClientSubject.REQUEST_BATTLE_DATA, (p, d) ->
                p.sendMessage(new ServerMessage<>(ServerSubject.BATTLE_DATA, p.getBattle().getBattleData(p.getId()))));
        readers.put(ClientSubject.REQUEST_PATHS_AND_REACHABLE_CELLS, (p, d) -> {
            final Map<String, Object> pathsAndReachableCells = new HashMap<>(2);
            pathsAndReachableCells.put("reachableCells", p.getBattle().getReachableCells());
            pathsAndReachableCells.put("paths", p.getBattle().getPaths());
            p.sendMessage(new ServerMessage<>(ServerSubject.PATHS_AND_REACHABLE_CELLS, pathsAndReachableCells));
        });
        readers.put(ClientSubject.MOVE_CURRENT_UNIT, (p, d) ->
                p.getBattle().moveCurrentUnit(p.getId(), new Cell(d.get("x"), d.get("y"))));
        readers.put(ClientSubject.REQUEST_GUN_CELLS, (p, d) -> {
            final GunCells gunCells = p.getBattle().getGunCells(d.get("gunId"));
            p.sendMessage(new ServerMessage<>(ServerSubject.GUN_CELLS, gunCells));
        });
        readers.put(ClientSubject.SHOOT_WITH_CURRENT_UNIT, ((p, d) ->
                p.getBattle().shootWithCurrentUnit(p.getId(), d.get("gunId"), new Cell(d.get("x"), d.get("y")))));
        readers.put(ClientSubject.END_TURN, (p, d) -> p.getBattle().endTurn(p.getId()));
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        final Player player = (Player) session.getAttributes().get("player");
        player.setSession(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) throws IOException {
        final Player player = (Player) session.getAttributes().get("player");
        final ClientMessage message = mapper.readValue(textMessage.getPayload(), ClientMessage.class);
        readers.get(message.getSubject()).read(player, message.getData());
    }
}
