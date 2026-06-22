package com.gongmodoc.service;

import com.gongmodoc.domain.Comment;
import com.gongmodoc.domain.CommentTag;
import com.gongmodoc.domain.DocumentFile;
import com.gongmodoc.repository.CommentRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CommentService {
    private final CommentRepository commentRepository;
    private final DocumentFileService fileService;

    public CommentService(CommentRepository commentRepository, DocumentFileService fileService) {
        this.commentRepository = commentRepository;
        this.fileService = fileService;
    }

    public List<Comment> comments(Long fileId, String sort) {
        if ("desc".equalsIgnoreCase(sort)) {
            return commentRepository.findByFileIdOrderByCreatedAtDesc(fileId);
        }
        return commentRepository.findByFileIdOrderByCreatedAtAsc(fileId);
    }

    @Transactional
    public Comment create(Long fileId, String authorNickname, String content, CommentTag tag) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("댓글을 입력하세요.");
        }
        if (authorNickname == null || authorNickname.isBlank()) {
            throw new IllegalArgumentException("댓글 작성자 닉네임이 필요합니다.");
        }
        DocumentFile file = fileService.getFile(fileId);
        return commentRepository.save(new Comment(file, authorNickname.trim(), content.trim(), tag));
    }

    @Transactional
    public Comment toggleResolved(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        comment.toggleResolved();
        return comment;
    }

    @Transactional
    public void delete(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new IllegalArgumentException("댓글을 찾을 수 없습니다.");
        }
        commentRepository.deleteById(commentId);
    }
}
