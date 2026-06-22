package com.gongmodoc.controller;

import com.gongmodoc.dto.CommentDtos.CommentResponse;
import com.gongmodoc.dto.CommentDtos.CreateCommentRequest;
import com.gongmodoc.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CommentController {
    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/files/{fileId}/comments")
    public List<CommentResponse> comments(@PathVariable Long fileId, @RequestParam(defaultValue = "asc") String sort) {
        return commentService.comments(fileId, sort).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @PostMapping("/files/{fileId}/comments")
    public CommentResponse create(@PathVariable Long fileId, @Valid @RequestBody CreateCommentRequest request) {
        return CommentResponse.from(commentService.create(fileId, request.authorNickname(), request.content(), request.tag()));
    }

    @PatchMapping("/comments/{commentId}/resolve")
    public CommentResponse toggleResolved(@PathVariable Long commentId) {
        return CommentResponse.from(commentService.toggleResolved(commentId));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable Long commentId) {
        commentService.delete(commentId);
        return ResponseEntity.noContent().build();
    }
}
