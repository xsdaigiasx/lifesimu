# Nội thất v0.28 — ảnh và cách hiển thị

Ngày 01/11/2026. Công cụ: image_gen tích hợp (built-in), không dùng CLI/API fallback. Bộ ảnh được tạo theo chỉ đạo render lại nội thất của người dùng. Ảnh runtime: public/assets/static-scenes/furniture-v2/{bed,wardrobe,desk,table,plant,lamp,rug}-{0,90}.png. Giữ nguyên rental-approved.webp.

## Prompt set

Chỉ dẫn chung: Use case stylized-concept. Standalone transparent isometric furniture game sprite, cozy painted3D style, honey oak and muted greens, thin dark brown outlines. Orthographic elevated camera about39degrees; width floor axis down-right31.4degrees and depth floor axis down-left37.8degrees. Soft light from upper-left. Entire object with all feet, 8percent transparent padding, genuine alpha. No floor/background, text, halo, glow or external cast shadow. For90degrees physically rotate on floor, swap axes; do not mirror a2D image. Bed reference used for wood and fabric style; approved room only for camera projection.

- bed: single honey oak bed,1m wide2m long, green woven blanket, cream sheet, one muted green pillow; four wooden posts.0:headboard upper-right and footboard lower-left;90:headboard upper-left and footboard lower-right.
- wardrobe: honey oak wardrobe, two plain doors with dark handles and one bottom drawer,1m wide0.5m deep1.8m tall.0:front lower-left;90:front lower-right.
- desk: oak work desk1m by1m including green chair partially tucked under, open dark laptop with screen toward chair.0:front lower-left;90:front lower-right; rotate laptop and chair together.
- table: small square oak dining table, four straight legs and one green round stool tucked under front edge.0:front/stool lower-left;90:front/stool lower-right. No dishes.
- plant: green monstera about90cm tall,5broad leaves and short stems, terracotta cylinder pot,50cm footprint.0:largest leaf lower-left;90:largest leaf lower-right, different leaf overlap.
- lamp: slim dark walnut floor lamp1.5m high, unlit cream conical fabric shade, thin pole and round base50cm diameter, short brass pull cord.0:cord left;90:cord right, camera fixed.
- rug: flat rectangular muted moss green woven rug1.5m by1m, cream thin border, short cream fringes only at short ends, no thickness/folds.0:long edges down-right31.4deg;90:long edges down-left37.8deg.

## Integration and limits

Each PNG preserves original generated alpha. home-art.ts records scale from alpha bounds and anchor from lowest opaque band. Scene sprite size uses its collision footprint. Tall items are independent AI views, not images from one reusable3D model, so minor design differences remain possible.

The generated rug90 did not reliably change its long axis, and both raw rug images included a translucent halo. The room therefore uses rug0 as a raster texture, clips to its woven rectangle and maps it to the four real floor corners with an affine matrix. A90-degree turn changes the physical floor axes, preserving textile details without mirroring. The90PNG is retained as a thumbnail/reference, not used for the room rug projection.

Foreground walls are clipped regions of the unchanged room background, drawn above furniture and below the object toolbar. Masks are fixed to this room illustration. No generated room replacement is used.

## v0.29 — bỏ tường phía trước và đồng bộ camera

Dùng image_gen tích hợp edit nền theo yêu cầu mới của người dùng: runtime public/assets/static-scenes/rental-open-front.png. Ảnh cũ giữ nguyên để truy vết. Không chỉ tắt lớp phủ: tường thấp và cửa trước được bỏ ngay trong ảnh mới.

Prompt nền: Use case precise-object-edit. Edit this exact approved isometric empty rental room game background. REMOVE ONLY the two near/foreground low cutaway walls and the foreground entrance wooden door including its frame, at the bottom-left edge and bottom-right edge of the room. Leave a thin exposed wooden floor slab edge there, open cutaway with unobstructed floor. Extend the existing honey oak floor up to those same original room footprint edges where the walls stood. Keep the original camera, scale, square composition, floor footprint, warm cream outside background, back walls/window, kitchenette and entire bathroom in place. Do not move, mirror, zoom, resize or recenter the room. Preserve floorboard directions. No furniture, people or text.

Prompt cây90: Edit the provided SINGLE potted monstera sprite into ONE new view after a90-degree turn around its vertical center. Exactly ONE plant in ONE terracotta pot, same five leaves, same size and orthographic camera39degrees. Show more of the right side and change leaf overlap. Preserve painted3D materials and thin brown outlines. Full pot bottom visible. ONE sprite, NOT a before/after pair or comparison sheet. Genuine alpha; no external glow, halo, floor, shadow or text. Runtime thay thế furniture-v2/plant-90.png; ảnh cũ nằm trong ZIPv0.28 lịch sử.

homeArtProjection chuẩn hóa độ dốc tham chiếu của8ảnh giường/tủ/bàn sang hai trục sàn: dùng shear theoY và scaleY, giữ cạnh đứng thẳng và điểm chân cố định. Các hệ số tham chiếu đo xấp xỉ theo cạnh trên của ảnh; sửa camera tổng thể, không phải dựng lại mesh3D và không bảo đảm mọi cạnh nhỏ của ảnh AI trực giao hoàn hảo. Bàn laptop bị ngược quy ước hướng trongv0.28, đã đổi hai biến thể trong metadata. Cây90 cũ chứa hai chậu, đã thay ảnh một chậu và đo lại scale/anchor.
