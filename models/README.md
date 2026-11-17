# Drop your Tripo models here

Export each model from Tripo as **GLB**, give it one of the names below and
put it in this folder. Reload the page and it replaces the placeholder.
Each model is scaled and placed on the ground automatically.

| File name        | Replaces                              | Section        |
| ---------------- | ------------------------------------- | -------------- |
| `figure.glb`     | The cardboard standee of you          | About          |
| `lowrider.glb`   | The purple lowrider                   | Experience     |
| `wall.glb`       | The brick wall (the KEITH tag stays)  | About / hero   |
| `shop.glb`       | The Stack Shop (neon signs stay)      | Skills         |
| `storefront.glb` | The "coming soon" storefront          | Projects       |
| `pawnshop.glb`   | The Trophy Room                       | Certifications |
| `court.glb`      | The basketball court and hoop         | Education      |
| `payphone.glb`   | The payphone                          | Contact        |

If a model faces the wrong way, or is too big or small, adjust `rotateY`,
`scale` or `offset` for that slot in `src/data/models.js`.

Aim for roughly 10–50k faces per model so the page stays fast.
