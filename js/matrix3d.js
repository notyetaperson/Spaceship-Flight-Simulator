// 3D Matrix Class (4x4 for transformations)
class Matrix3D {
    constructor() {
        this.m = new Float32Array(16);
        this.identity();
    }

    identity() {
        this.m.fill(0);
        this.m[0] = 1;  // m00
        this.m[5] = 1;  // m11
        this.m[10] = 1; // m22
        this.m[15] = 1; // m33
        return this;
    }

    multiply(other) {
        const result = new Matrix3D();
        const a = this.m;
        const b = other.m;
        const r = result.m;

        r[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
        r[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
        r[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
        r[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];

        r[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
        r[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
        r[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
        r[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];

        r[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
        r[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
        r[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
        r[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];

        r[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
        r[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
        r[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
        r[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];

        return result;
    }

    translate(x, y, z) {
        this.m[12] += x;
        this.m[13] += y;
        this.m[14] += z;
        return this;
    }

    rotateX(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotation = new Matrix3D();
        rotation.m[5] = cos;
        rotation.m[6] = sin;
        rotation.m[9] = -sin;
        rotation.m[10] = cos;
        return this.multiply(rotation);
    }

    rotateY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotation = new Matrix3D();
        rotation.m[0] = cos;
        rotation.m[2] = -sin;
        rotation.m[8] = sin;
        rotation.m[10] = cos;
        return this.multiply(rotation);
    }

    rotateZ(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotation = new Matrix3D();
        rotation.m[0] = cos;
        rotation.m[1] = sin;
        rotation.m[4] = -sin;
        rotation.m[5] = cos;
        return this.multiply(rotation);
    }

    lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        const eye = new Vector3D(eyeX, eyeY, eyeZ);
        const center = new Vector3D(centerX, centerY, centerZ);
        const up = new Vector3D(upX, upY, upZ);

        const f = center.subtract(eye).normalize();
        const s = f.cross(up).normalize();
        const u = s.cross(f);

        this.identity();
        this.m[0] = s.x;
        this.m[1] = u.x;
        this.m[2] = -f.x;
        this.m[4] = s.y;
        this.m[5] = u.y;
        this.m[6] = -f.y;
        this.m[8] = s.z;
        this.m[9] = u.z;
        this.m[10] = -f.z;
        this.m[12] = -s.dot(eye);
        this.m[13] = -u.dot(eye);
        this.m[14] = f.dot(eye);

        return this;
    }

    transformVector(v) {
        const x = v.x * this.m[0] + v.y * this.m[4] + v.z * this.m[8] + this.m[12];
        const y = v.x * this.m[1] + v.y * this.m[5] + v.z * this.m[9] + this.m[13];
        const z = v.x * this.m[2] + v.y * this.m[6] + v.z * this.m[10] + this.m[14];
        return new Vector3D(x, y, z);
    }
}

