package com.gongmodoc.repository;

import com.gongmodoc.domain.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByFileIdOrderByCreatedAtAsc(Long fileId);

    List<Comment> findByFileIdOrderByCreatedAtDesc(Long fileId);

    long countByFileId(Long fileId);

    long countByFileIdAndResolvedFalse(Long fileId);

    void deleteByFileId(Long fileId);
}
