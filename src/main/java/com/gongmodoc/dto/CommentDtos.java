package com.gongmodoc.dto;

import com.gongmodoc.domain.Comment;
import com.gongmodoc.domain.CommentTag;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public final class CommentDtos {
    private CommentDtos() {
    }

    public record CreateCommentRequest(@NotBlank String authorNickname, @NotBlank String content, CommentTag tag) {
    }

    public record CommentResponse(
            Long id,
            Long fileId,
            String authorNickname,
            String content,
            CommentTag tag,
            String tagLabel,
            LocalDateTime createdAt,
            boolean resolved
    ) {
        public static CommentResponse from(Comment comment) {
            return new CommentResponse(
                    comment.getId(),
                    comment.getFile().getId(),
                    comment.getAuthorNickname(),
                    comment.getContent(),
                    comment.getTag(),
                    comment.getTag().getLabel(),
                    comment.getCreatedAt(),
                    comment.isResolved()
            );
        }
    }
}
