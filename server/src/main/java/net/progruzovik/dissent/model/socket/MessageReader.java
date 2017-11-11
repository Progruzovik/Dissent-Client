package net.progruzovik.dissent.model.socket;

import net.progruzovik.dissent.battle.player.Player;

import java.util.Map;

@FunctionalInterface
public interface MessageReader {

    void read(Player p, Map<String, Integer> d);
}
