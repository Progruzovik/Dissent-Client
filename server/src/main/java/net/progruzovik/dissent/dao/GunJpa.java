package net.progruzovik.dissent.dao;

import net.progruzovik.dissent.model.Gun;
import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

@Repository
public class GunJpa implements GunDao {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Gun getGun(int id) {
        return entityManager.find(Gun.class, id);
    }
}
