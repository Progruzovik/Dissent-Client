package net.progruzovik.dissent.model.battle;

import net.progruzovik.dissent.battle.player.Captain;
import net.progruzovik.dissent.battle.player.Status;
import net.progruzovik.dissent.exception.InvalidShotException;
import net.progruzovik.dissent.model.battle.field.Field;
import net.progruzovik.dissent.model.entity.Ship;
import net.progruzovik.dissent.model.socket.Message;
import net.progruzovik.dissent.model.util.Cell;

public final class Battle {

    private static final int UNIT_INDENT = 3;
    private static final int BORDER_INDENT = 4;

    private boolean isRunning = true;

    private final Captain leftCaptain;
    private final Captain rightCaptain;

    private final UnitQueue unitQueue = new UnitQueue();
    private final Field field;

    public Battle(Captain leftCaptain, Captain rightCaptain) {
        this.leftCaptain = leftCaptain;
        leftCaptain.setBattle(this);
        this.rightCaptain = rightCaptain;
        rightCaptain.setBattle(this);

        final int maxShipsCountOnSide = Math.max(leftCaptain.getShips().size(), rightCaptain.getShips().size());
        final int colsCount = maxShipsCountOnSide * UNIT_INDENT + BORDER_INDENT * 2;
        field = new Field(new Cell(colsCount, colsCount));
        int i = 0;
        for (final Ship ship : leftCaptain.getShips()) {
            registerUnit(new Unit(new Cell(0, i * UNIT_INDENT + BORDER_INDENT), Side.LEFT, ship));
            i++;
        }
        i = 0;
        for (final Ship ship : rightCaptain.getShips()) {
            registerUnit(new Unit(new Cell(colsCount - 1, i * UNIT_INDENT + BORDER_INDENT), Side.RIGHT, ship));
            i++;
        }
        onNextTurn();
    }

    public UnitQueue getUnitQueue() {
        return unitQueue;
    }

    public Field getField() {
        return field;
    }

    public Side getPlayerSide(String playerId) {
        if (leftCaptain.getId().equals(playerId)) return Side.LEFT;
        if (rightCaptain.getId().equals(playerId)) return Side.RIGHT;
        return Side.NONE;
    }

    public void moveCurrentUnit(String playerId, Cell cell) {
        if (isIdBelongsToCurrentPlayer(playerId)) {
            createMessage(new Message<>("move", field.moveActiveUnit(cell)));
        }
    }

    public void shootWithCurrentUnit(String playerId, int gunId, Cell cell) {
        if (isIdBelongsToCurrentPlayer(playerId) && field.canActiveUnitHitCell(gunId, cell)) {
            final Unit target = unitQueue.getUnitOnCell(cell);
            if (target == null) throw new InvalidShotException();

            final int damage = unitQueue.getCurrentUnit().shoot(gunId, target);
            field.createPathsForActiveUnit();
            createMessage(new Message<>("shot", new Shot(gunId, damage, cell)));
            if (target.getShip().getStrength() == 0) {
                unitQueue.getQueue().remove(target);
                field.destroyUnit(target);
                if (!unitQueue.hasUnitsOnBothSides()) {
                    isRunning = false;
                    leftCaptain.setStatus(Status.IDLE);
                    rightCaptain.setStatus(Status.IDLE);
                    createMessage(new Message<>("battleFinish", null));
                }
            }
        }
    }

    public void endTurn(String playerId) {
        if (isIdBelongsToCurrentPlayer(playerId)) {
            unitQueue.nextTurn();
            createMessage(new Message<>("nextTurn", null));
            onNextTurn();
        }
    }

    private boolean isIdBelongsToCurrentPlayer(String id) {
        final Captain currentCaptain = getCurrentPlayer();
        return currentCaptain != null && currentCaptain.getId().equals(id);
    }

    private Captain getCurrentPlayer() {
        if (!isRunning) return null;
        switch (unitQueue.getCurrentUnit().getSide()) {
            case LEFT: return leftCaptain;
            case RIGHT: return rightCaptain;
            default: return null;
        }
    }

    private void onNextTurn() {
        final Captain captain = getCurrentPlayer();
        if (captain != null) {
            unitQueue.getCurrentUnit().activate();
            field.setActiveUnit(unitQueue.getCurrentUnit());
            captain.act();
        }
    }

    private void registerUnit(Unit unit) {
        field.addUnit(unit);
        unitQueue.addUnit(unit);
    }

    private void createMessage(Message message) {
        leftCaptain.send(message);
        rightCaptain.send(message);
    }
}
