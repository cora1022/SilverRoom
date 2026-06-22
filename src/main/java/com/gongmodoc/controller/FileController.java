package com.gongmodoc.controller;

import com.gongmodoc.domain.DocumentFile;
import com.gongmodoc.domain.FileType;
import com.gongmodoc.dto.FileDtos.FileResponse;
import com.gongmodoc.dto.FileDtos.FileSummaryResponse;
import com.gongmodoc.dto.FileDtos.UpdateFileRequest;
import com.gongmodoc.repository.CommentRepository;
import com.gongmodoc.service.DocumentFileService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private final DocumentFileService fileService;
    private final CommentRepository commentRepository;

    public FileController(DocumentFileService fileService, CommentRepository commentRepository) {
        this.fileService = fileService;
        this.commentRepository = commentRepository;
    }

    @GetMapping("/current")
    public ResponseEntity<FileResponse> current() {
        return fileService.currentFile()
                .map(FileResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping
    public List<FileSummaryResponse> files() {
        return fileService.allFiles().stream()
                .map(file -> FileSummaryResponse.from(
                        file,
                        commentRepository.countByFileId(file.getId()),
                        commentRepository.countByFileIdAndResolvedFalse(file.getId())
                ))
                .toList();
    }

    @GetMapping("/{fileId}")
    public FileResponse file(@PathVariable Long fileId) {
        return FileResponse.from(fileService.getFile(fileId));
    }

    @PostMapping("/upload")
    public FileResponse upload(@RequestParam MultipartFile file, @RequestParam String uploaderNickname) throws Exception {
        return FileResponse.from(fileService.upload(file, uploaderNickname));
    }

    @PostMapping("/{fileId}/restore")
    public FileResponse restore(@PathVariable Long fileId) {
        return FileResponse.from(fileService.restore(fileId));
    }

    @PutMapping("/{fileId}")
    public FileResponse update(@PathVariable Long fileId, @Valid @RequestBody UpdateFileRequest request) {
        return FileResponse.from(fileService.update(
                fileId,
                request.originalFileName(),
                request.fileType(),
                request.content()
        ));
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> delete(@PathVariable Long fileId) {
        fileService.delete(fileId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long fileId, @RequestParam(defaultValue = "txt") String format) {
        DocumentFile file = fileService.getFile(fileId);
        String baseName = file.getOriginalFileName().replaceAll("\\.[^.]+$", "");
        String extension = file.getFileType() == FileType.MD ? "md" : "txt";
        String downloadName = baseName + "." + extension;

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(downloadName))
                .body(file.getContent().getBytes(StandardCharsets.UTF_8));
    }

    private String contentDisposition(String fileName) {
        String encodedName = java.net.URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                .replace("+", "%20");
        return "attachment; filename=\"silverroom." + fileName.replaceAll("^.*\\.", "") + "\"; filename*=UTF-8''" + encodedName;
    }
}
