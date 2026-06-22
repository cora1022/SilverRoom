package com.gongmodoc.repository;

import com.gongmodoc.domain.DocumentFile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentFileRepository extends JpaRepository<DocumentFile, Long> {
    Optional<DocumentFile> findFirstByCurrentTrue();

    List<DocumentFile> findAllByOrderByUploadedAtDesc();
}
