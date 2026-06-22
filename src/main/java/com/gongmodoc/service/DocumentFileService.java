package com.gongmodoc.service;

import com.gongmodoc.domain.DocumentFile;
import com.gongmodoc.domain.FileType;
import com.gongmodoc.repository.CommentRepository;
import com.gongmodoc.repository.DocumentFileRepository;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentFileService {
    private final DocumentFileRepository fileRepository;
    private final CommentRepository commentRepository;
    private final long maxSizeBytes;

    public DocumentFileService(
            DocumentFileRepository fileRepository,
            CommentRepository commentRepository,
            @Value("${app.upload.max-size-bytes}") long maxSizeBytes
    ) {
        this.fileRepository = fileRepository;
        this.commentRepository = commentRepository;
        this.maxSizeBytes = maxSizeBytes;
    }

    public Optional<DocumentFile> currentFile() {
        return fileRepository.findFirstByCurrentTrue();
    }

    public DocumentFile getFile(Long fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다."));
    }

    public List<DocumentFile> allFiles() {
        return fileRepository.findAllByOrderByUploadedAtDesc();
    }

    @Transactional
    public DocumentFile upload(MultipartFile multipartFile, String uploaderNickname) throws IOException {
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new IllegalArgumentException("파일을 선택해주세요.");
        }
        if (multipartFile.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("파일 크기는 2MB 이하만 가능합니다.");
        }
        if (uploaderNickname == null || uploaderNickname.isBlank()) {
            throw new IllegalArgumentException("업로드한 사람 닉네임이 필요합니다.");
        }

        String originalName = Optional.ofNullable(multipartFile.getOriginalFilename()).orElse("document.txt");
        FileType fileType = resolveFileType(originalName);
        String content = new String(multipartFile.getBytes(), StandardCharsets.UTF_8);

        fileRepository.findFirstByCurrentTrue().ifPresent(file -> file.markCurrent(false));
        DocumentFile nextCurrent = new DocumentFile(originalName, fileType, content, uploaderNickname.trim());
        return fileRepository.save(nextCurrent);
    }

    @Transactional
    public DocumentFile restore(Long fileId) {
        DocumentFile target = getFile(fileId);
        fileRepository.findFirstByCurrentTrue().ifPresent(file -> file.markCurrent(false));
        target.markCurrent(true);
        return target;
    }

    @Transactional
    public DocumentFile update(Long fileId, String originalFileName, FileType fileType, String content) {
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new IllegalArgumentException("파일명이 필요합니다.");
        }
        if (fileType == null) {
            throw new IllegalArgumentException("파일 형식이 필요합니다.");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("작성 내용을 입력해주세요.");
        }
        if (content.getBytes(StandardCharsets.UTF_8).length > maxSizeBytes) {
            throw new IllegalArgumentException("파일 크기는 2MB 이하만 가능합니다.");
        }

        String sanitizedName = originalFileName.trim();
        FileType resolvedType = resolveFileType(sanitizedName);
        if (resolvedType != fileType) {
            throw new IllegalArgumentException("파일명 확장자와 파일 형식이 일치하지 않습니다.");
        }

        DocumentFile target = getFile(fileId);
        target.updateDocument(sanitizedName, fileType, content);
        return target;
    }

    @Transactional
    public void delete(Long fileId) {
        DocumentFile target = getFile(fileId);
        if (target.isCurrent()) {
            throw new IllegalArgumentException("현재 파일은 삭제할 수 없습니다.");
        }
        commentRepository.deleteByFileId(fileId);
        fileRepository.delete(target);
    }

    private FileType resolveFileType(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".md")) {
            return FileType.MD;
        }
        if (lower.endsWith(".txt") || lower.endsWith(".text")) {
            return FileType.TXT;
        }
        throw new IllegalArgumentException("지원하는 파일 형식은 .txt, .md 입니다.");
    }
}
