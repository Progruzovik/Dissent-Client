package net.progruzovik.dissent.battle;

import net.progruzovik.dissent.dao.ShipDao;
import net.progruzovik.dissent.model.Ship;
import net.progruzovik.dissent.model.Unit;
import net.progruzovik.dissent.player.Player;
import net.progruzovik.dissent.util.Point;

import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

public final class FieldService implements Field {

    private static final int UNIT_INDENT = 3;
    private static final int BORDER_INDENT = 4;

    private final Point size;
    private int turnNumber = 0;

    private final Player leftPlayer;
    private final Player rightPlayer;

    private final Queue<Unit> queue = new LinkedList<>();
    private final ShipDao shipDao;

    public FieldService(Player leftPlayer, Player rightPlayer, ShipDao shipDao) {
        final int unitsCount = Math.max(leftPlayer.getUnits().size(), rightPlayer.getUnits().size());
        final int colsCount = unitsCount * UNIT_INDENT + BORDER_INDENT * 2;
        size = new Point(colsCount, colsCount);

        int i = 0;
        for (final Unit unit : leftPlayer.getUnits()) {
            unit.setSide(Side.Left);
            unit.setCell(new Point(0, i * UNIT_INDENT + BORDER_INDENT));
            queue.add(unit);
            i++;
        }
        this.leftPlayer = leftPlayer;
        i = 0;
        for (final Unit unit : rightPlayer.getUnits()) {
            unit.setSide(Side.Right);
            unit.setCell(new Point(colsCount - 1, i * UNIT_INDENT + BORDER_INDENT));
            queue.add(unit);
            i++;
        }
        this.rightPlayer = rightPlayer;

        this.shipDao = shipDao;
    }

    @Override
    public Point getSize() {
        return size;
    }

    @Override
    public List<Ship> getShips() {
        return shipDao.getShips();
    }

    @Override
    public int getTurnNumber() {
        return turnNumber;
    }

    @Override
    public Unit getCurrentUnit() {
        return queue.element();
    }

    @Override
    public Queue<Unit> getQueue() {
        return queue;
    }

    @Override
    public Side getPlayerSide(Player player) {
        if (player == leftPlayer) {
            return Side.Left;
        }
        if (player == rightPlayer) {
            return Side.Right;
        }
        return Side.None;
    }

    @Override
    public boolean moveCurrentUnit(Player player, Point cell) {
        if (player == getCurrentPlayer() && cell.getX() > -1 && cell.getX() < size.getX()
                && cell.getY() > -1 && cell.getY() < size.getY()) {
            getCurrentUnit().setCell(cell);
            return true;
        }
        return false;
    }

    @Override
    public boolean nextTurn(Player player) {
        if (player == getCurrentPlayer()) {
            turnNumber++;
            queue.add(queue.remove());
            while (player != getCurrentPlayer()) {
                turnNumber++;
                queue.add(queue.remove());
            }
            return true;
        }
        return false;
    }

    private Player getCurrentPlayer() {
        switch (getCurrentUnit().getSide()) {
            case Left: return leftPlayer;
            case Right: return rightPlayer;
            default: return null;
        }
    }
}
