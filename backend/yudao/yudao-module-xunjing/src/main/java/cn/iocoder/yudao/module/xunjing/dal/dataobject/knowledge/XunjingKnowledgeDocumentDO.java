package cn.iocoder.yudao.module.xunjing.dal.dataobject.knowledge;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_knowledge_document")
@KeySequence("xunjing_knowledge_document_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingKnowledgeDocumentDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long packageId;
    private String title;
    private String sourceType;
    private String sourceUrl;
    private String contentDigest;
    private String authorityLevel;
    private String reviewStatus;
    private String vectorStatus;

}
