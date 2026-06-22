package com.gongmodoc.domain;

public enum CommentTag {
    NONE("기본"),
    CHANGE_REQUEST("수정요청"),
    IDEA("아이디어"),
    NEEDS_CHECK("확인필요");

    private final String label;

    CommentTag(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
