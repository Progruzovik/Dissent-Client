package net.progruzovik.dissent.battle;

import net.progruzovik.dissent.model.player.AiPlayer;
import net.progruzovik.dissent.model.player.Player;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public final class ScenarioService implements Scenario {

    private final Player player;

    private final FieldFactory fieldFactory;
    private final ObjectFactory<AiPlayer> aiPlayerFactory;

    public ScenarioService(@Qualifier("sessionPlayer") Player player,
                           FieldFactory fieldFactory, ObjectFactory<AiPlayer> aiPlayerFactory) {
        this.player = player;
        this.fieldFactory = fieldFactory;
        this.aiPlayerFactory = aiPlayerFactory;
    }

    @Override
    public void start() {
        final Player aiPlayer = aiPlayerFactory.getObject();
        final Battle battle = fieldFactory.create(player, aiPlayer);
        player.setBattle(battle);
        aiPlayer.setBattle(battle);
    }
}
