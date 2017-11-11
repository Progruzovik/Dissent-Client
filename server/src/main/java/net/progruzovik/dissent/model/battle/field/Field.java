package net.progruzovik.dissent.model.battle.field;

import net.progruzovik.dissent.exception.InvalidMoveException;
import net.progruzovik.dissent.exception.InvalidUnitException;
import net.progruzovik.dissent.model.battle.Side;
import net.progruzovik.dissent.model.battle.Unit;
import net.progruzovik.dissent.model.entity.Gun;
import net.progruzovik.dissent.model.util.Cell;
import net.progruzovik.dissent.model.util.Point;

import java.util.*;
import java.util.function.Predicate;

public final class Field {

    private final Cell size;
    private final List<List<Location>> map;
    private final List<Cell> asteroids = new ArrayList<>();
    private final List<Cell> clouds = new ArrayList<>();
    private final List<Unit> destroyedUnits = new ArrayList<>();

    private Unit activeUnit;
    private final List<List<PathNode>> currentPaths;
    private int preparedGunId;
    private final List<Cell> shotCells = new ArrayList<>();
    private final List<Cell> targetCells = new ArrayList<>();

    public Field(Cell size) {
        this.size = size;
        map = new ArrayList<>(size.getX());
        currentPaths = new ArrayList<>(size.getX());
        for (int i = 0; i < size.getX(); i++) {
            map.add(new ArrayList<>(size.getY()));
            currentPaths.add(new ArrayList<>(size.getY()));
            for (int j = 0; j < size.getY(); j++) {
                map.get(i).add(new Location());
                currentPaths.get(i).add(null);
            }
        }

        asteroids.add(new Cell(5, 3));
        asteroids.add(new Cell(5, 4));
        asteroids.add(new Cell(5, 5));
        asteroids.add(new Cell(6, 4));
        asteroids.add(new Cell(6, 5));
        for (final Cell asteroid : asteroids) {
            map.get(asteroid.getX()).set(asteroid.getY(), new Location(LocationStatus.ASTEROID));
        }
        clouds.add(new Cell(getSize().getX() - 5, 3));
        clouds.add(new Cell(getSize().getX() - 5, 4));
        clouds.add(new Cell(getSize().getX() - 5, 5));
        clouds.add(new Cell(getSize().getX() - 6, 4));
        clouds.add(new Cell(getSize().getX() - 6, 5));
        for (final Cell cloud : clouds) {
            map.get(cloud.getX()).set(cloud.getY(), new Location(LocationStatus.CLOUD));
        }
    }

    public Cell getSize() {
        return size;
    }

    public void setActiveUnit(Unit activeUnit) {
        if (activeUnit.getSide() == Side.NONE || map.get(activeUnit.getCell().getX())
                .get(activeUnit.getCell().getY()).getCurrentStatus() != activeUnit.getCellStatus()) {
            throw new InvalidUnitException();
        }
        this.activeUnit = activeUnit;
        createPathsForActiveUnit();
    }

    public List<List<PathNode>> getCurrentPaths() {
        return currentPaths;
    }

    public List<Cell> getAsteroids() {
        return asteroids;
    }

    public List<Cell> getClouds() {
        return clouds;
    }

    public List<Cell> getShotCells() {
        return shotCells;
    }

    public List<Cell> getTargetCells() {
        return targetCells;
    }

    public List<Unit> getDestroyedUnits() {
        return destroyedUnits;
    }

    public boolean canActiveUnitHitCell(int gunId, Cell cell) {
        if (preparedGunId != gunId) {
            prepareGunForActiveUnit(gunId);
        }
        return targetCells.contains(cell);
    }

    public List<Cell> findReachableCellsForActiveUnit() {
        return findNeighborsInRadius(activeUnit.getCell(), activeUnit.getActionPoints(), c -> !isCellReachable(c));
    }

    public void addUnit(Unit unit) {
        map.get(unit.getCell().getX()).get(unit.getCell().getY()).setCurrentStatus(unit.getCellStatus());
    }

    public void createPathsForActiveUnit() {
        for (final List<PathNode> currentPath : currentPaths) {
            for (int j = 0; j < currentPath.size(); j++) {
                currentPath.set(j, null);
            }
        }
        currentPaths.get(activeUnit.getCell().getX())
                .set(activeUnit.getCell().getY(), new PathNode(0, activeUnit.getCell()));

        final Queue<Cell> cellQueue = new LinkedList<>();
        cellQueue.offer(activeUnit.getCell());
        while (!cellQueue.isEmpty()) {
            final Cell cell = cellQueue.poll();
            final int distanceToCell = currentPaths.get(cell.getX()).get(cell.getY()).getMovementCost();
            for (final Cell neighborCell : findNeighborsForCell(cell)) {
                final Location neighborLocation = map.get(neighborCell.getX()).get(neighborCell.getY());
                final int distanceToNeighbor = distanceToCell + neighborLocation.getMovementCost();
                final PathNode pathFromNeighbor = currentPaths.get(neighborCell.getX()).get(neighborCell.getY());
                if (distanceToNeighbor <= activeUnit.getActionPoints()
                        && (pathFromNeighbor == null || pathFromNeighbor.getMovementCost() > distanceToNeighbor)) {
                    currentPaths.get(neighborCell.getX())
                            .set(neighborCell.getY(), new PathNode(distanceToNeighbor, cell));
                    cellQueue.offer(neighborCell);
                }
            }
        }
    }

    public Move moveActiveUnit(Cell cell) {
        if (!cell.isInBorders(size) || !isCellReachable(cell)) {
            throw new InvalidMoveException(activeUnit.getActionPoints(), activeUnit.getCell(), cell);
        }
        final int movementCost = currentPaths.get(cell.getX()).get(cell.getY()).getMovementCost();
        map.get(activeUnit.getCell().getX()).get(activeUnit.getCell().getY()).resetStatusToDefault();
        map.get(cell.getX()).get(cell.getY()).setCurrentStatus(activeUnit.getCellStatus());

        final List<Cell> cells = new ArrayList<>();
        Cell pathCell = cell;
        while (!pathCell.equals(activeUnit.getCell())) {
            cells.add(pathCell);
            pathCell = currentPaths.get(pathCell.getX()).get(pathCell.getY()).getCell();
        }
        activeUnit.move(cell, movementCost);
        createPathsForActiveUnit();
        return new Move(movementCost, cells);
    }

    public void prepareGunForActiveUnit(int gunId) {
        preparedGunId = gunId;
        shotCells.clear();
        targetCells.clear();

        final Gun gun = activeUnit.getShip().getGun(gunId);
        if (gun != null) {
            final List<Cell> availableCells = findNeighborsInRadius(activeUnit.getCell(), gun.getRadius(), c -> {
                final List<Cell> cellsInBetween = findCellsInBetween(activeUnit.getCell(), c);
                for (int i = 1; i < cellsInBetween.size() - 1; i++) {
                    if (map.get(cellsInBetween.get(i).getX())
                            .get(cellsInBetween.get(i).getY()).getCurrentStatus() != LocationStatus.EMPTY) {
                        return true;
                    }
                }
                return false;
            });
            final LocationStatus targetStatus = activeUnit.getCellStatus() == LocationStatus.UNIT_LEFT
                    ? LocationStatus.UNIT_RIGHT : LocationStatus.UNIT_LEFT;
            for (final Cell cell : availableCells) {
                final LocationStatus locationStatus = map.get(cell.getX()).get(cell.getY()).getCurrentStatus();
                if (locationStatus == LocationStatus.EMPTY) {
                    shotCells.add(cell);
                }  else if (locationStatus == targetStatus) {
                    targetCells.add(cell);
                }
            }
        }
    }

    public void destroyUnit(Unit unit) {
        destroyedUnits.add(unit);
        map.get(unit.getCell().getX()).get(unit.getCell().getY()).setCurrentStatus(LocationStatus.UNIT_DESTROYED);
        targetCells.remove(unit.getCell());
    }

    private boolean isCellReachable(Cell cell) {
        final LocationStatus locationStatus = map.get(cell.getX()).get(cell.getY()).getCurrentStatus();
        return currentPaths.get(cell.getX()).get(cell.getY()) != null
                && (locationStatus == LocationStatus.EMPTY || locationStatus == LocationStatus.CLOUD);
    }

    private List<Cell> findNeighborsForCell(Cell cell) {
        return findNeighborsInRadius(cell, 1, c -> false);
    }

    private List<Cell> findNeighborsInRadius(Cell cell, int radius, Predicate<Cell> removeIf) {
        final List<Cell> result = new ArrayList<>();
        for (int i = 0; i < radius; i++) {
            for (int j = 1; j <= radius - i; j++) {
                result.add(new Cell(cell.getX() + i, cell.getY() - j));
                result.add(new Cell(cell.getX() - i, cell.getY() + j));
                result.add(new Cell(cell.getX() + j, cell.getY() + i));
                result.add(new Cell(cell.getX() - j, cell.getY() - i));
            }
        }
        result.removeIf(c -> !c.isInBorders(size) || removeIf.test(c));
        return result;
    }

    private List<Cell> findCellsInBetween(Cell firstCell, Cell lastCell) {
        final int dx = lastCell.getX() - firstCell.getX(), dy = lastCell.getY() - firstCell.getY();
        if (dx > -2 && dx < 2 && dy > -2 && dy < 2) {
            final List<Cell> result = new ArrayList<>(2);
            result.add(firstCell);
            result.add(lastCell);
            return result;
        }

        final Point<Float> center = firstCell.findCenter(lastCell);
        final Cell firstCenterCell = new Cell(), secondCenterCell = new Cell();
        if (center.getX() == Math.floor(center.getX())) {
            firstCenterCell.setX(center.getX().intValue());
            secondCenterCell.setX(firstCenterCell.getX());
        } else {
            if (firstCell.getX() < lastCell.getX()) {
                firstCenterCell.setX((int) Math.floor(center.getX()));
                secondCenterCell.setX(firstCenterCell.getX() + 1);
            } else {
                firstCenterCell.setX((int) Math.ceil(center.getX()));
                secondCenterCell.setX(firstCenterCell.getX() - 1);
            }
        }
        if (center.getY() == Math.floor(center.getY())) {
            firstCenterCell.setY(center.getY().intValue());
            secondCenterCell.setY(firstCenterCell.getY());
        } else {
            if (firstCell.getY() < lastCell.getY()) {
                firstCenterCell.setY((int) Math.floor(center.getY()));
                secondCenterCell.setY(firstCenterCell.getY() + 1);
            } else {
                firstCenterCell.setY((int) Math.ceil(center.getY()));
                secondCenterCell.setY(firstCenterCell.getY() - 1);
            }
        }

        final List<Cell> result = findCellsInBetween(firstCell, firstCenterCell);
        final int firstCellIndexWithOffset = result.size() - 2;
        if (!firstCenterCell.equals(secondCenterCell)) {
            result.add(secondCenterCell);
        }
        Cell nextCell = new Cell(secondCenterCell);
        for (int i = firstCellIndexWithOffset; i > -1; i--) {
            nextCell.setX(nextCell.getX() + result.get(i + 1).getX() - result.get(i).getX());
            nextCell.setY(nextCell.getY() + result.get(i + 1).getY() - result.get(i).getY());
            result.add(nextCell);
            nextCell = new Cell(nextCell);
        }
        return result;
    }
}
