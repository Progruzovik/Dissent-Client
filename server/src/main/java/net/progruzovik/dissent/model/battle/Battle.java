package net.progruzovik.dissent.model.battle;

import net.progruzovik.dissent.battle.captain.Captain;
import net.progruzovik.dissent.exception.InvalidShotException;
import net.progruzovik.dissent.model.battle.field.Field;
import net.progruzovik.dissent.model.battle.field.PathNode;
import net.progruzovik.dissent.model.entity.Ship;
import net.progruzovik.dissent.model.socket.Message;
import net.progruzovik.dissent.model.util.Cell;

import java.util.List;

import static net.progruzovik.dissent.model.battle.field.Field.BORDER_INDENT;
import static net.progruzovik.dissent.model.battle.field.Field.UNIT_INDENT;

public final class Battle {

    private boolean isRunning = true;

    private final Captain leftCaptain;
    private final Captain rightCaptain;

    private final UnitQueue unitQueue;
    private final Field field;

    public Battle(Captain leftCaptain, Captain rightCaptain, UnitQueue unitQueue, Field field) {
        this.leftCaptain = leftCaptain;
        this.rightCaptain = rightCaptain;
        this.unitQueue = unitQueue;
        this.field = field;
    }

    public BattleData getBattleData(String captainId) {
        return new BattleData(getCaptainSide(captainId), field.getSize(),
                unitQueue.getUniqueHulls(), unitQueue.getUniqueGuns(), field.getAsteroids(),
                field.getClouds(), unitQueue.getUnits(), field.getDestroyedUnits());
    }

    public boolean isRunning() {
        return isRunning;
    }

    public List<List<PathNode>> getCurrentPaths() {
        return field.getCurrentPaths();
    }

    public List<Cell> getShotCells() {
        return field.getShotCells();
    }

    public List<Cell> getTargetCells() {
        return field.getTargetCells();
    }

    public void registerShip(int number, Side side, Ship ship) {
        final int unitCol = side == Side.RIGHT ? field.getSize().getX() - 1 : 0;
        final Unit unit = new Unit(new Cell(unitCol, number * UNIT_INDENT + BORDER_INDENT), side, ship);
        field.addUnit(unit);
        unitQueue.addUnit(unit);
    }

    public void startBattle() {
        onNextTurn();
    }

    public List<Cell> findReachableCellsForActiveUnit() {
        return field.findReachableCellsForActiveUnit();
    }

    public void moveCurrentUnit(String captainId, Cell cell) {
        if (isIdBelongsToCurrentCaptain(captainId)) {
            createMessage(new Message<>("move", field.moveActiveUnit(cell)));
        }
    }

    public void prepareGunForActiveUnit(int gunId) {
        field.prepareGunForActiveUnit(gunId);
    }

    public void shootWithCurrentUnit(String captainId, int gunId, Cell cell) {
        if (isIdBelongsToCurrentCaptain(captainId) && field.canActiveUnitHitCell(gunId, cell)) {
            final Unit target = unitQueue.getUnitOnCell(cell);
            if (target == null) throw new InvalidShotException();

            final int damage = unitQueue.getCurrentUnit().shoot(gunId, target);
            field.createPathsForActiveUnit();
            createMessage(new Message<>("shot", new Shot(gunId, damage, cell)));
            if (target.getShip().getStrength() == 0) {
                unitQueue.getUnits().remove(target);
                field.destroyUnit(target);
                if (!unitQueue.hasUnitsOnBothSides()) {
                    isRunning = false;
                    createMessage(new Message("battleFinish"));
                }
            }
        }
    }

    public void endTurn(String captainId) {
        if (isIdBelongsToCurrentCaptain(captainId)) {
            unitQueue.nextTurn();
            createMessage(new Message("nextTurn"));
            onNextTurn();
        }
    }

    private boolean isIdBelongsToCurrentCaptain(String id) {
        return getCurrentCaptain() != null && getCurrentCaptain().getId().equals(id);
    }

    private Side getCaptainSide(String captainId) {
        if (leftCaptain.getId().equals(captainId)) return Side.LEFT;
        if (rightCaptain.getId().equals(captainId)) return Side.RIGHT;
        return Side.NONE;
    }

    private Captain getCurrentCaptain() {
        if (!isRunning) return null;
        switch (unitQueue.getCurrentUnit().getSide()) {
            case LEFT: return leftCaptain;
            case RIGHT: return rightCaptain;
            default: return null;
        }
    }

    private void onNextTurn() {
        final Captain captain = getCurrentCaptain();
        if (captain != null) {
            unitQueue.getCurrentUnit().activate();
            field.setActiveUnit(unitQueue.getCurrentUnit());
            captain.act(unitQueue.getCurrentUnit());
        }
    }

    private void createMessage(Message message) {
        leftCaptain.sendMessage(message);
        rightCaptain.sendMessage(message);
    }
}
