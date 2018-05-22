package net.progruzovik.dissent.battle.model;

import net.progruzovik.dissent.battle.exception.InvalidShotException;
import net.progruzovik.dissent.battle.model.field.Field;
import net.progruzovik.dissent.battle.model.field.GunCells;
import net.progruzovik.dissent.battle.model.field.PathNode;
import net.progruzovik.dissent.battle.model.util.Cell;
import net.progruzovik.dissent.model.Message;
import net.progruzovik.dissent.model.entity.Ship;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.*;

import static net.progruzovik.dissent.battle.model.field.Field.BORDER_INDENT;
import static net.progruzovik.dissent.battle.model.field.Field.UNIT_INDENT;

public final class Battle extends Observable {

    public static final String TIME_TO_ACT = "timeToAct";

    private boolean isRunning = true;

    private final @NonNull String leftCaptainId;
    private final @NonNull String rightCaptainId;

    private final @NonNull List<LogEntry> log = new ArrayList<>();

    private final @NonNull UnitQueue unitQueue;
    private final @NonNull Field field;

    public Battle(@NonNull String leftCaptainId, @NonNull String rightCaptainId,
                  @NonNull UnitQueue unitQueue, @NonNull Field field) {
        this.leftCaptainId = leftCaptainId;
        this.rightCaptainId = rightCaptainId;
        this.unitQueue = unitQueue;
        this.field = field;
    }

    public boolean isRunning() {
        return isRunning;
    }

    @NonNull
    public Unit getCurrentUnit() {
        return unitQueue.getCurrentUnit();
    }

    @NonNull
    public BattleData getBattleData(String captainId) {
        return new BattleData(getCaptainSide(captainId), field.getSize(), log,
                field.getAsteroids(), field.getClouds(), unitQueue.getUnits(), field.getDestroyedUnits());
    }

    @NonNull
    public List<List<PathNode>> getPaths() {
        return field.getPaths();
    }

    @NonNull
    public List<Cell> getReachableCells() {
        return field.getReachableCells();
    }

    public boolean isIdBelongsToCurrentCaptain(String id) {
        return Objects.equals(getCurrentCaptainId(), id);
    }

    @NonNull
    public GunCells getGunCells(int gunId) {
        return field.getGunCells(gunId);
    }

    @Override
    public void notifyObservers() {
        setChanged();
        super.notifyObservers();
    }

    @Override
    public void notifyObservers(Object arg) {
        setChanged();
        super.notifyObservers(arg);
    }

    public void addShips(Side side, List<Ship> ships) {
        for (int i = 0; i < ships.size(); i++) {
            final Ship ship = ships.get(i);
            final int column = side == Side.RIGHT ? field.getSize().getX() - ship.getHull().getWidth() : 0;
            final Unit unit = new Unit(new Cell(column, i * UNIT_INDENT + BORDER_INDENT), side, ship);
            field.addUnit(unit);
            unitQueue.addUnit(unit);
        }
    }

    public void startBattle() {
        onNextTurn();
    }

    public void moveCurrentUnit(String captainId, Cell cell) {
        if (isIdBelongsToCurrentCaptain(captainId)) {
            notifyObservers(new Message<>("move", field.moveActiveUnit(cell)));
        }
    }

    public void shootWithCurrentUnit(String captainId, int gunId, Cell cell) {
        if (isIdBelongsToCurrentCaptain(captainId) && field.canActiveUnitHitCell(gunId, cell)) {
            final Unit currentUnit = unitQueue.getCurrentUnit();
            final Unit target = unitQueue.findUnitOnCell(cell).orElseThrow(() ->
                    new InvalidShotException(String.format("There is no target on cell %s!", cell)));

            final int damage = currentUnit.shoot(gunId, target);
            field.updateActiveUnit();
            log.add(new LogEntry(damage, currentUnit.getSide(), currentUnit.getShip().findGunById(gunId),
                    currentUnit.getShip().getHull(), target.getShip().getHull()));
            notifyObservers(new Message<>("shot", new Shot(gunId, damage, target.getFirstCell())));
            if (target.getShip().getStrength() == 0) {
                unitQueue.getUnits().remove(target);
                field.destroyUnit(target);
                if (!unitQueue.hasUnitsOnBothSides()) {
                    isRunning = false;
                    field.resetActiveUnit();
                    notifyObservers(new Message<>("battleFinish"));
                    deleteObservers();
                }
            }
        }
    }

    public void endTurn(String captainId) {
        if (isIdBelongsToCurrentCaptain(captainId)) {
            unitQueue.nextTurn();
            notifyObservers(new Message<>("nextTurn"));
            onNextTurn();
        }
    }

    @NonNull
    private Side getCaptainSide(String captainId) {
        if (leftCaptainId.equals(captainId)) return Side.LEFT;
        if (rightCaptainId.equals(captainId)) return Side.RIGHT;
        return Side.NONE;
    }

    @Nullable
    private String getCurrentCaptainId() {
        if (!isRunning) return null;
        switch (unitQueue.getCurrentUnit().getSide()) {
            case LEFT: return leftCaptainId;
            case RIGHT: return rightCaptainId;
            default: return null;
        }
    }

    private void onNextTurn() {
        unitQueue.getCurrentUnit().activate();
        field.setActiveUnit(unitQueue.getCurrentUnit());
        notifyObservers(new Message<>(TIME_TO_ACT));
    }
}
