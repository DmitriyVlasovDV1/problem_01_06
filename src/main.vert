#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexTexCoord;
in float vertexId;

uniform float uTime;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform float uMandTimeSpeed;

out vec3 TexCoord;

void main(void)
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition.x + (cos(uTime * uMandTimeSpeed) * 0.05), aVertexPosition.y + (abs(sin(uTime * uMandTimeSpeed)) * 0.1), aVertexPosition.z, 1.0);
    TexCoord = aVertexTexCoord;
}