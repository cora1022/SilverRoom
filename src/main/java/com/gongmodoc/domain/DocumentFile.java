package com.gongmodoc.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
public class DocumentFile {
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String originalFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FileType fileType;

    @Column(nullable = false, length = 2_200_000)
    private String content;

    @Column(nullable = false)
    private String uploaderNickname;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    @Column(nullable = false)
    private boolean current;

    protected DocumentFile() {
    }

    public DocumentFile(String originalFileName, FileType fileType, String content, String uploaderNickname) {
        this.originalFileName = originalFileName;
        this.fileType = fileType;
        this.content = content;
        this.uploaderNickname = uploaderNickname;
        this.uploadedAt = LocalDateTime.now(SEOUL_ZONE);
        this.current = true;
    }

    public Long getId() {
        return id;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public FileType getFileType() {
        return fileType;
    }

    public String getContent() {
        return content;
    }

    public String getUploaderNickname() {
        return uploaderNickname;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public boolean isCurrent() {
        return current;
    }

    public void markCurrent(boolean current) {
        this.current = current;
    }

    public void updateDocument(String originalFileName, FileType fileType, String content) {
        this.originalFileName = originalFileName;
        this.fileType = fileType;
        this.content = content;
    }
}
