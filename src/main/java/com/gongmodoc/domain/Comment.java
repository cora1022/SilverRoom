package com.gongmodoc.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
public class Comment {
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id")
    private DocumentFile file;

    @Column(nullable = false)
    private String authorNickname;

    @Column(nullable = false, length = 2000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column
    private CommentTag tag = CommentTag.NONE;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean resolved;

    protected Comment() {
    }

    public Comment(DocumentFile file, String authorNickname, String content, CommentTag tag) {
        this.file = file;
        this.authorNickname = authorNickname;
        this.content = content;
        this.tag = tag == null ? CommentTag.NONE : tag;
        this.createdAt = LocalDateTime.now(SEOUL_ZONE);
        this.resolved = false;
    }

    public Long getId() {
        return id;
    }

    public DocumentFile getFile() {
        return file;
    }

    public String getAuthorNickname() {
        return authorNickname;
    }

    public String getContent() {
        return content;
    }

    public CommentTag getTag() {
        return tag == null ? CommentTag.NONE : tag;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public boolean isResolved() {
        return resolved;
    }

    public void toggleResolved() {
        this.resolved = !this.resolved;
    }
}
