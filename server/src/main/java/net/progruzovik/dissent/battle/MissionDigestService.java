package net.progruzovik.dissent.battle;

import net.progruzovik.dissent.captain.AiCaptain;
import net.progruzovik.dissent.captain.Captain;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.stereotype.Service;

@Service
public final class MissionDigestService implements MissionDigest {

    private final ObjectFactory<AiCaptain> aiCaptainFactory;
    private final BattleCreator battleCreator;

    public MissionDigestService(ObjectFactory<AiCaptain> aiCaptainFactory, BattleCreator battleCreator) {
        this.aiCaptainFactory = aiCaptainFactory;
        this.battleCreator = battleCreator;
    }

    @Override
    public void start(Captain captain) {
        battleCreator.createBattle(captain, aiCaptainFactory.getObject());
    }
}
