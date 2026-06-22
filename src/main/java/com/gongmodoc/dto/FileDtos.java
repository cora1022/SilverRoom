package com.gongmodoc.dto;

import com.gongmodoc.domain.DocumentFile;
import com.gongmodoc.domain.FileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public final class FileDtos {
    private FileDtos() {
    }

    public record FileResponse(
            Long id,
            String originalFileName,
            FileType fileType,
            String content,
            String uploaderNickname,
            LocalDateTime uploadedAt,
            boolean current
    ) {
        public static FileResponse from(DocumentFile file) {
            return new FileResponse(
                    file.getId(),
                    file.getOriginalFileName(),
                    file.getFileType(),
                    file.getContent(),
                    file.getUploaderNickname(),
                    file.getUploadedAt(),
                    file.isCurrent()
            );
        }
    }

    public record FileSummaryResponse(
            Long id,
            String originalFileName,
            FileType fileType,
            String uploaderNickname,
            LocalDateTime uploadedAt,
            boolean current,
            long commentCount,
            long unresolvedCommentCount
    ) {
        public static FileSummaryResponse from(DocumentFile file, long commentCount, long unresolvedCommentCount) {
            return new FileSummaryResponse(
                    file.getId(),
                    file.getOriginalFileName(),
                    file.getFileType(),
                    file.getUploaderNickname(),
                    file.getUploadedAt(),
                    file.isCurrent(),
                    commentCount,
                    unresolvedCommentCount
            );
        }
    }

    public record UpdateFileRequest(
            @NotBlank String originalFileName,
            @NotNull FileType fileType,
            @NotBlank String content
    ) {
    }
}
