package net.progruzovik.dissent.battle.player;

import net.progruzovik.dissent.dao.GunDao;
import net.progruzovik.dissent.dao.HullDao;
import net.progruzovik.dissent.model.battle.Battle;
import net.progruzovik.dissent.model.battle.Unit;
import net.progruzovik.dissent.model.entity.Gun;
import net.progruzovik.dissent.model.entity.Hull;
import net.progruzovik.dissent.model.entity.Ship;
import net.progruzovik.dissent.model.socket.Message;
import net.progruzovik.dissent.model.util.Cell;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public final class AiCaptain implements Captain {

    private final List<Ship> ships = new ArrayList<>();
    private Battle battle;

    public AiCaptain(HullDao hullDao, GunDao gunDao) {
        final Hull aiHull = hullDao.getHull(3);
        final Gun shrapnel = gunDao.getGun(1);
        ships.add(new Ship(aiHull, shrapnel, null));
        ships.add(new Ship(aiHull, shrapnel, null));
    }

    @Override
    public String getId() {
        return "AI_PLAYER";
    }

    @Override
    public List<Ship> getShips() {
        return ships;
    }

    @Override
    public void setStatus(Status status) { }

    @Override
    public Battle getBattle() {
        return battle;
    }

    @Override
    public void setBattle(Battle battle) {
        this.battle = battle;
    }

    @Override
    public void act(Unit unit) {
        if (unit.getShip().getFirstGun() != null) {
            boolean canCurrentUnitMove = true;
            while (unit.getActionPoints() >= unit.getShip().getFirstGun().getShotCost()
                    && canCurrentUnitMove) {
                getBattle().prepareGunForActiveUnit(unit.getShip().getFirstGunId());
                final List<Cell> targetCells = getBattle().getTargetCells();
                if (targetCells.isEmpty()) {
                    final List<Cell> reachableCells = getBattle().findReachableCellsForActiveUnit();
                    if (reachableCells.isEmpty()) {
                        canCurrentUnitMove = false;
                    } else {
                        final Random random = new Random();
                        getBattle().moveCurrentUnit(getId(),
                                reachableCells.get(random.nextInt(reachableCells.size())));
                    }
                } else {
                    getBattle().shootWithCurrentUnit(getId(),
                            unit.getShip().getFirstGunId(), targetCells.get(0));
                }
            }
        }
        getBattle().endTurn(getId());
    }

    @Override
    public void send(Message message) { }
}
