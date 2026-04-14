package com.pharmaflow.auth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<RoleEntity, Integer> {

    Optional<RoleEntity> findByRoleName(PharmaRoleName roleName);

    @Query(value = "select * from roles r " +
            "where (:query is null or :query = '' " +
            "or lower(r.role_name) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(r.description, '')) like lower(concat('%', :query, '%'))) " +
            "order by r.role_name",
            countQuery = "select count(*) from roles r " +
                    "where (:query is null or :query = '' " +
                    "or lower(r.role_name) like lower(concat('%', :query, '%')) " +
                    "or lower(coalesce(r.description, '')) like lower(concat('%', :query, '%')))",
            nativeQuery = true)
    Page<RoleEntity> searchRoles(@Param("query") String query, Pageable pageable);
}
