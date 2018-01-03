package net.progruzovik.dissent.socket;

import net.progruzovik.dissent.captain.Player;

import java.util.Map;

@FunctionalInterface
public interface Reader {

    void read(Player player, Map<String, Integer> data);
}
